# Subscription & Billing Documentation

## Overview
Meet Me Halfway uses Stripe for subscription management and billing. This document covers the complete implementation including pricing tiers, subscription lifecycle, webhooks, and billing portal integration.

## Pricing Tiers

### Starter (Free)
- **Price**: $0/month
- **Features**:
  - Up to 2 locations for midpoint calculation
  - Standard place search & route calculation
  - Community support
- **Limitations**:
  - No saved searches
  - Basic routing only (no traffic data)
  - Limited API usage

### Plus
- **Pricing**:
  - Weekly: $2.49/week
  - Monthly: $9/month
  - Annually: $90/year (equivalent to $7.50/month)
- **Features**:
  - Up to 3 locations for midpoint calculation
  - Faster route calculations
  - Save up to 10 favorite locations
  - Basic email support
- **Stripe Price IDs**:
  - Weekly: `STRIPE_PRICE_PLUS_WEEKLY`
  - Monthly: `STRIPE_PRICE_PLUS_MONTHLY`
  - Yearly: `STRIPE_PRICE_PLUS_YEARLY`

### Pro
- **Pricing**:
  - Weekly: $4.99/week
  - Monthly: $19/month
  - Annually: $190/year (equivalent to ~$15.83/month)
- **Features**:
  - Up to 5 locations for midpoint calculation
  - **Real-time traffic data for accurate ETAs** (HERE API)
  - Saved searches and unlimited favorite locations
  - Advanced analytics & fairness scores (Coming Soon)
  - Priority email support
- **Stripe Price IDs**:
  - Weekly: `STRIPE_PRICE_PRO_WEEKLY`
  - Monthly: `STRIPE_PRICE_PRO_MONTHLY`
  - Yearly: `STRIPE_PRICE_PRO_YEARLY`

### Business
- **Pricing**:
  - Weekly: $24.99/week
  - Monthly: $99/month
  - Annually: $990/year (equivalent to $82.50/month)
- **Features**:
  - Up to 10 locations for midpoint calculation
  - Includes 5 seats (user licenses)
  - All Pro features
  - Dedicated account manager (Coming Soon)
  - Custom integration options (Coming Soon)
- **Stripe Price IDs**:
  - Weekly: `STRIPE_PRICE_BUSINESS_WEEKLY`
  - Monthly: `STRIPE_PRICE_BUSINESS_MONTHLY`
  - Yearly: `STRIPE_PRICE_BUSINESS_YEARLY`

## Implementation Architecture

### Core Components

#### 1. Stripe Configuration
**File**: `lib/stripe.ts`
- Stripe client initialization
- Environment-specific configuration
- Error handling utilities

#### 2. Tier Mapping
**File**: `lib/stripe/tier-map.ts`
- Maps Stripe Price IDs to application tiers
- Defines tier features and pricing
- Handles tier validation

#### 3. Subscription Actions
**File**: `actions/stripe-actions.ts`
- `createCheckoutSession`: Creates Stripe checkout sessions
- `createBillingPortalSession`: Manages existing subscriptions
- `manageSubscriptionStatusChange`: Handles webhook events
- `updateStripeCustomer`: Updates customer data

#### 4. Plan Enforcement
**File**: `lib/auth/plan.ts`
- `getUserPlanInfo`: Retrieves current user plan
- `requireProPlan`: Enforces Pro tier access
- `usePlan`: React hook for plan data

### Database Schema

#### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- Clerk user ID
  membership TEXT NOT NULL DEFAULT 'starter',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  seat_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Subscription Lifecycle

### 1. Checkout Process

#### Initiation
```typescript
// User clicks upgrade button
const result = await createCheckoutSession({ 
  priceId: 'price_1234567890' 
});

if (result.url) {
  window.location.href = result.url;
}
```

#### Checkout Session Creation
1. Validate user authentication
2. Check for existing subscriptions
3. Create Stripe checkout session
4. Redirect to Stripe Checkout

#### Success Flow
1. User completes payment on Stripe
2. Stripe redirects to success URL
3. Webhook processes `checkout.session.completed`
4. User profile updated with subscription data
5. User gains access to new tier features

### 2. Webhook Handling

#### Webhook Endpoint
**File**: `app/api/stripe/webhooks/route.ts`

#### Supported Events
- `checkout.session.completed`: New subscription created
- `customer.subscription.updated`: Subscription modified
- `customer.subscription.deleted`: Subscription cancelled

#### Event Processing
```typescript
switch (event.type) {
  case "checkout.session.completed":
    await handleCheckoutSession(event);
    break;
  case "customer.subscription.updated":
  case "customer.subscription.deleted":
    await handleSubscriptionChange(event);
    break;
}
```

### 3. Subscription Management

#### Billing Portal
Users can manage their subscriptions through Stripe's billing portal:
```typescript
const portal = await createBillingPortalSessionAction();
if (portal.url) {
  window.location.href = portal.url;
}
```

#### Plan Changes
- **Upgrades**: Immediate access with prorated billing
- **Downgrades**: Access maintained until next billing cycle
- **Cancellations**: Access maintained until period end

## Feature Access Control

### Tier-Based Restrictions

#### Location Limits
```typescript
const getMaxLocations = (tier: Tier): number => {
  switch (tier) {
    case 'starter': return 2;
    case 'plus': return 3;
    case 'pro': return 5;
    case 'business': return 10;
    default: return 2;
  }
};
```

#### API Access
- **Starter/Plus**: OpenRouteService for travel times
- **Pro/Business**: HERE API for traffic-aware routing
- **Business**: Additional API rate limits

#### Feature Gates
```typescript
// Example: Pro feature enforcement
export async function requireProPlan() {
  const plan = await getUserPlanInfo();
  if (!plan || !['pro', 'business'].includes(plan.membership)) {
    throw new Error('Pro plan required for this feature');
  }
}
```

## Environment Configuration

### Required Environment Variables

#### Stripe Configuration
```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_... # or sk_test_ for development
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs - Plus Tier
STRIPE_PRICE_PLUS_WEEKLY=price_...
STRIPE_PRICE_PLUS_MONTHLY=price_...
STRIPE_PRICE_PLUS_YEARLY=price_...

# Price IDs - Pro Tier
STRIPE_PRICE_PRO_WEEKLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...

# Price IDs - Business Tier
STRIPE_PRICE_BUSINESS_WEEKLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...
```

#### Database Configuration
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Stripe Dashboard Configuration

#### Products & Prices
1. Create products for each tier (Plus, Pro, Business)
2. Create prices for each billing cycle (weekly, monthly, yearly)
3. Configure price IDs in environment variables

#### Webhooks
1. Configure webhook endpoint: `https://yourdomain.com/api/stripe/webhooks`
2. Select events: `checkout.session.completed`, `customer.subscription.*`
3. Copy webhook secret to environment variables

## Error Handling

### Common Scenarios

#### Payment Failures
- **Insufficient Funds**: User redirected to update payment method
- **Card Declined**: Clear error message with retry option
- **Network Issues**: Graceful fallback with manual retry

#### Subscription Sync Issues
- **Webhook Delays**: Polling mechanism for critical updates
- **Data Inconsistency**: Manual sync tools for support team
- **Failed Webhooks**: Retry mechanism with exponential backoff

### Error Monitoring
- Stripe dashboard for payment issues
- Application logs for webhook processing
- PostHog analytics for conversion tracking

## Testing

### Test Mode Configuration
```env
STRIPE_SECRET_KEY=sk_test_...
# Use test price IDs for all tiers
```

### Test Scenarios
1. **Successful Subscription**: Complete checkout flow
2. **Failed Payment**: Test with declined test cards
3. **Webhook Processing**: Verify all event types
4. **Plan Enforcement**: Test tier restrictions
5. **Billing Portal**: Test subscription management

### Test Cards
- **Success**: `4242424242424242`
- **Declined**: `4000000000000002`
- **Insufficient Funds**: `4000000000009995`

## Security Considerations

### Data Protection
- Stripe handles all payment data (PCI compliant)
- No credit card information stored in application
- Customer IDs and subscription data encrypted at rest

### Webhook Security
- Webhook signature verification required
- HTTPS-only webhook endpoints
- Idempotency handling for duplicate events

### Access Control
- User can only access their own subscription data
- Admin functions require special permissions
- API endpoints protected with authentication

## Monitoring & Analytics

### Key Metrics
- **Conversion Rate**: Free to paid subscriptions
- **Churn Rate**: Subscription cancellations
- **Revenue**: Monthly recurring revenue (MRR)
- **Plan Distribution**: Users per tier

### Tracking Implementation
```typescript
// Example: Track subscription events
await trackEvent('subscription_created', {
  tier: 'pro',
  billing_cycle: 'monthly',
  amount: 19.00
});
```

### Dashboards
- Stripe Dashboard for payment analytics
- PostHog for user behavior and conversion funnels
- Custom dashboards for business metrics

## Troubleshooting

### Common Issues

#### Subscription Not Updating
1. Check webhook delivery in Stripe dashboard
2. Verify webhook endpoint is accessible
3. Review application logs for processing errors
4. Manual sync if necessary

#### Payment Failures
1. Check Stripe dashboard for decline reasons
2. Verify customer payment methods
3. Review fraud detection settings
4. Contact Stripe support if needed

#### Feature Access Issues
1. Verify user's current subscription status
2. Check tier mapping configuration
3. Review plan enforcement logic
4. Clear user session cache if needed

### Debug Tools
- Stripe CLI for webhook testing
- Stripe Dashboard for payment debugging
- Application logs for subscription processing
- PostHog for user behavior analysis

## Migration & Deployment

### Production Deployment
1. Switch to live Stripe keys
2. Update webhook endpoints
3. Test critical flows in production
4. Monitor for issues

### Data Migration
- Existing users default to Starter tier
- Manual migration for grandfathered users
- Subscription data sync verification

## Future Enhancements

### Planned Features
1. **Team Management**: Multi-user business accounts
2. **Usage-Based Billing**: Pay-per-use options
3. **Enterprise Plans**: Custom pricing for large organizations
4. **Promotional Codes**: Discount and trial management
5. **Invoice Customization**: Branded invoices and receipts

### Technical Improvements
1. **Subscription Analytics**: Advanced reporting dashboard
2. **A/B Testing**: Pricing optimization experiments
3. **Dunning Management**: Automated failed payment recovery
4. **Tax Handling**: Automated tax calculation and compliance

## Related Documentation
- [Upgrade Modal Implementation](UPGRADE_MODAL_IMPLEMENTATION.md)
- [App Structure](app-structure.md)
- [API Documentation](api-docs.md)
- [HERE API Integration](HERE_API_INTEGRATION.md)

---

*This documentation covers the complete subscription and billing implementation. For the latest pricing and features, refer to the live application and Stripe dashboard.* 