"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Star, Zap, Building, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { createCheckoutSession } from "@/actions/stripe/createCheckoutSession";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";

type Cadence = "weekly" | "monthly" | "annually";
type Tier = "Starter" | "Plus" | "Pro" | "Business";

interface PricingTier {
  name: Tier;
  id: string;
  price: { weekly: string; monthly: string; annually: string };
  description: string;
  features: { text: string; unavailable?: boolean }[];
  mostPopular?: boolean;
  cta: string;
  isCustom?: boolean;
  stripePriceId?: string;
}

const tiers: PricingTier[] = [
  {
    name: "Starter",
    id: "tier-starter",
    price: { weekly: "$0", monthly: "$0", annually: "$0" },
    description: "Get started with our basic features, completely free.",
    features: [
      { text: "Up to 2 locations per search" },
      { text: "Basic route calculations" },
      { text: "Points of interest discovery" },
      { text: "Email support (standard response time)" },
      { text: "Documentation and guides" },
      { text: "Ad-free experience", unavailable: true },
      { text: "Real-time traffic data", unavailable: true },
    ],
    cta: "Get Started",
  },
  {
    name: "Plus",
    id: "tier-plus",
    price: { weekly: "$1.49", monthly: "$4.99", annually: "$49.00" },
    description: "Perfect for friends, families, and small teams.",
    features: [
      { text: "Up to 3 locations per search" },
      { text: "Ad-free experience" },
      { text: "Basic route calculations" },
      { text: "Points of interest discovery" },
      { text: "Priority email support" },
      { text: "Real-time traffic data", unavailable: true },
      { text: "Advanced route optimization", unavailable: true },
    ],
    cta: "Choose Plus",
    mostPopular: true,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY,
  },
  {
    name: "Pro",
    id: "tier-pro",
    price: { weekly: "$4.99", monthly: "$19.00", annually: "$190.00" },
    description: "Advanced features for professionals and power users.",
    features: [
      { text: "Up to 5 locations per search" },
      { text: "Real-time traffic data for accurate ETAs" },
      { text: "Advanced route optimization" },
      { text: "Ad-free experience" },
      { text: "Priority email support" },
      { text: "Points of interest discovery" },
      { text: "Faster route calculations" },
    ],
    cta: "Choose Pro",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
  },
  {
    name: "Business",
    id: "tier-business",
    price: { weekly: "$24.99", monthly: "$99.00", annually: "$990.00" },
    description: "Complete solution for teams and enterprises.",
    features: [
      { text: "All Pro features" },
      { text: "Up to 10 locations per search" },
      { text: "Real-time traffic data" },
      { text: "Advanced route optimization" },
      { text: "Priority email support" },
      { text: "Team collaboration features" },
      { text: "Enhanced analytics" },
    ],
    cta: "Choose Business",
    isCustom: false,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY,
  },
];

const tierIcons = {
  Starter: <Star className="h-5 w-5 text-yellow-500" />,
  Plus: <Zap className="h-5 w-5 text-orange-500" />,
  Pro: <Zap className="h-5 w-5 text-purple-500" />,
  Business: <Building className="h-5 w-5 text-blue-600" />,
};


export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<Cadence>("monthly");
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);
  const { track } = useAnalytics();

  const getPriceSuffix = (cycle: Cadence) => {
    if (cycle === "weekly") return "/week";
    if (cycle === "monthly") return "/month";
    if (cycle === "annually") return "/year";
    return "";
  };

  const handleCheckout = async (tier: PricingTier) => {
    if (tier.name === "Starter") {
      // For starter tier, just redirect to the app
      window.location.href = "/meet-me-halfway";
      return;
    }

    if (!tier.stripePriceId) {
      toast.error("Pricing configuration error. Please contact support.");
      return;
    }

    setIsRedirecting(tier.id);
    
    // Track the checkout attempt
    track(ANALYTICS_EVENTS.CHECKOUT_STARTED, {
      tier: tier.name.toLowerCase(),
      billing_cycle: billingCycle,
      source: 'pricing_page'
    });

    try {
      const result = await createCheckoutSession({ priceId: tier.stripePriceId });

      if (result.url) {
        window.location.href = result.url;
      } else if (result.error) {
        toast.error(result.error);
        setIsRedirecting(null);
      } else {
        toast.error("Could not initiate checkout. Please try again.");
        setIsRedirecting(null);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsRedirecting(null);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-80px)] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">Pricing</h1>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Plans for every need
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600 dark:text-gray-300">
          Choose the perfect plan to help you find the ideal meeting point, effortlessly.
          Save time and coordinate with ease.
        </p>

        <div className="mt-16 flex justify-center">
          <RadioGroup
            defaultValue="monthly"
            onValueChange={(val) => setBillingCycle(val as Cadence)}
            className="grid grid-cols-3 gap-x-2 rounded-lg bg-muted p-1 text-muted-foreground sm:max-w-md"
          >
            <div>
              <RadioGroupItem value="weekly" id="weekly" className="sr-only" />
              <Label htmlFor="weekly" className={`block w-full cursor-pointer rounded-md py-2 px-3 text-center ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-background data-[state=checked]:text-foreground hover:bg-accent hover:text-accent-foreground ${billingCycle === 'weekly' ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Weekly</Label>
            </div>
            <div>
              <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
              <Label htmlFor="monthly" className={`block w-full cursor-pointer rounded-md py-2 px-3 text-center ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-background data-[state=checked]:text-foreground hover:bg-accent hover:text-accent-foreground ${billingCycle === 'monthly' ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Monthly</Label>
            </div>
            <div>
              <RadioGroupItem value="annually" id="annually" className="sr-only" />
              <Label htmlFor="annually" className={`block w-full cursor-pointer rounded-md py-2 px-3 text-center ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-background data-[state=checked]:text-foreground hover:bg-accent hover:text-accent-foreground ${billingCycle === 'annually' ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Annually <span className="text-sm text-green-600 dark:text-green-400">(Save ~17%)</span></Label>
            </div>
          </RadioGroup>
        </div>

        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-4">
          {tiers.map((tier) => (
            <Card
              key={tier.id}
              className={`flex flex-col rounded-3xl ${
                tier.mostPopular ? "ring-2 ring-blue-600 dark:ring-blue-500 shadow-2xl" : "ring-1 ring-gray-200 dark:ring-gray-700"
              } ${tier.name === 'Starter' ? 'bg-gray-100 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800'}`}
            >
              <CardHeader className="pt-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold leading-7 text-gray-900 dark:text-white flex items-center">
                    {tierIcons[tier.name]}
                    <span className="ml-2">{tier.name}</span>
                  </h3>
                  {tier.mostPopular && (
                    <p className="rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-blue-600 dark:text-blue-400">
                      Most popular
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-x-2">
                  <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {tier.price[billingCycle]}
                  </span>
                  {tier.price[billingCycle] !== "$0" && !tier.isCustom && (
                    <span className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-300">
                      {getPriceSuffix(billingCycle)}
                    </span>
                  )}
                </div>
                <CardDescription className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-400 min-h-[40px]">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between">
                <ul role="list" className="mt-6 space-y-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {tier.features.map((feature) => (
                    <li key={feature.text} className="flex gap-x-3 items-center">
                      {feature.unavailable ? (
                        <XCircle className="h-5 w-5 flex-none text-red-500 dark:text-red-400" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 flex-none text-blue-600 dark:text-blue-500" aria-hidden="true" />
                      )}
                      <span className={feature.unavailable ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-200'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-8 p-6">
                <Button 
                  className="w-full" 
                  variant={tier.mostPopular ? 'default' : 'outline'} 
                  size="lg" 
                  onClick={() => handleCheckout(tier)}
                  disabled={isRedirecting !== null}
                >
                  {tier.cta}
                  {isRedirecting === tier.id && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { q: "Can I change my plan later?", a: "Yes, you can upgrade or downgrade your plan at any time through your account settings." },
              { q: "What payment methods do you accept?", a: "We accept all major credit cards through our secure Stripe payment processor." },
              { q: "Is there a discount for annual billing?", a: "Yes, you save approximately 17% (equivalent to 2 months free) by choosing an annual plan over monthly." },
              { q: "What's the difference between traffic data and basic routing?", a: "Pro and Business plans include real-time traffic data for more accurate travel times, while other plans use standard routing algorithms." },
              { q: "How many locations can I use for finding meeting points?", a: "Starter: 2 locations, Plus: 3 locations, Pro: 5 locations, Business: 10 locations." },
              { q: "Do you offer refunds?", a: "We offer a 7-day money-back guarantee on all paid plans." },
            ].map((faq, i) => (
              <div key={i} className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow ring-1 ring-gray-900/5 dark:ring-white/10">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                   <HelpCircle className="h-5 w-5 mr-2 text-blue-500" /> {faq.q}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
         <p className="text-center text-sm text-muted-foreground mt-12">
          All prices in USD. Features and pricing subject to change.
          By subscribing, you agree to our <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
} 