'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Check, Loader2 } from 'lucide-react';
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession';
// TODO: Implement a proper toast notification system
// import { toast } from "sonner"

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Handler for the upgrade button
  const handleUpgrade = () => {
    // Start the transition to update pending state immediately
    startTransition(() => {
      // You could set other synchronous state here if needed
    });

    // Define the async operation separately
    const performCheckout = async () => {
      try {
        console.log(`Attempting upgrade: yearly=${isYearly}`);
        const { url, error } = await createCheckoutSession({ isYearly });

        if (error) {
          console.error("Checkout error:", error);
          alert(`Error: ${error}`); // Placeholder alert
          // isPending will reset automatically via useTransition
          return;
        }

        if (url) {
          console.log("Redirecting to Stripe Checkout:", url);
          window.location.href = url; // Redirect to Stripe
        } else {
           console.error("Checkout failed: No URL returned and no error specified.");
           alert("An unexpected error occurred during checkout. Please try again.");
        }
      } catch (err) {
        console.error("Exception during checkout attempt:", err);
        alert("An unexpected error occurred. Please try again.");
      }
      // isPending will reset automatically via useTransition after async ops complete
    };

    // Execute the async operation
    performCheckout();
  };

  // Define features for comparison
  const features = [
    { name: 'Number of Locations', free: '2', pro: 'Unlimited', proOnly: true },
    { name: 'Real-time Traffic Updates', free: '-', pro: <Check className="h-5 w-5 text-green-500" />, proOnly: true },
    { name: 'Advanced Route Optimization', free: '-', pro: <Check className="h-5 w-5 text-green-500" />, proOnly: true },
    { name: 'Saved Searches', free: '3', pro: 'Unlimited', proOnly: false },
    { name: 'Ad-Free Experience', free: '-', pro: <Check className="h-5 w-5 text-green-500" />, proOnly: true },
    { name: 'Priority Support', free: '-', pro: <Check className="h-5 w-5 text-green-500" />, proOnly: true },
  ];

  const freePlanPrice = '$0';
  const proPlanPrice = isYearly ? '$99.99/year' : '$9.99/month';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Find the Perfect Plan</h1>
        <p className="text-lg text-muted-foreground mb-6">Start for free, upgrade for powerful features.</p>
        <div className="flex items-center justify-center space-x-4">
          <span>Monthly</span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Toggle billing frequency" disabled={isPending}/>
          <span>Yearly (Save 20%)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        {/* Free Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Perfect for occasional use and basic planning.</CardDescription>
            <div className="text-3xl font-bold mt-4">{freePlanPrice}</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.filter(f => !f.proOnly).map((feature) => (
              <div key={feature.name} className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>{feature.name}: {feature.free}</span>
              </div>
            ))}
             {features.filter(f => f.proOnly).map((feature) => (
              <div key={feature.name} className="flex items-center text-muted-foreground">
                <span className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0">-</span>
                <span>{feature.name}</span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            {/* TODO: Conditionally show this button based on user's actual plan */}
            <Button variant="outline" className="w-full" disabled>Current Plan</Button>
          </CardFooter>
        </Card>

        {/* Pro Plan Card */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>Unlock unlimited potential for frequent travelers and groups.</CardDescription>
            <div className="text-3xl font-bold mt-4">{proPlanPrice}</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex items-center">
                 {feature.pro === '-' ?
                   <span className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0">-</span> :
                   <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                 }
                 <span>
                   {feature.name}
                   {typeof feature.pro === 'string' && feature.pro !== '-' ? `: ${feature.pro}` : ''}
                </span>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            {/* TODO: Conditionally show Upgrade vs Manage Billing based on user's plan */}
            <Button className="w-full" onClick={handleUpgrade} disabled={isPending}>
              {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Upgrade to Pro'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Placeholder for FAQ Section */}
      <div className="text-center my-16">
        <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
        <p className="text-muted-foreground">FAQ section coming soon...</p>
        {/* TODO: Add FAQ items here */}
      </div>

      {/* Placeholder for Social Proof/Testimonials */}
      <div className="text-center mt-16">
        <h2 className="text-3xl font-bold mb-6">Trusted by Users</h2>
        <p className="text-muted-foreground">Social proof section coming soon...</p>
        {/* TODO: Add testimonials or logos here */}
      </div>
    </div>
  );
} 