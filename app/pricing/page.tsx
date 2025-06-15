"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Star, Zap, Building, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Cadence = "weekly" | "monthly" | "annually";
type Tier = "Starter" | "Plus" | "Pro" | "Business";

interface PricingTier {
  name: Tier;
  id: string;
  href: string;
  price: { weekly: string; monthly: string; annually: string };
  description: string;
  features: { text: string; unavailable?: boolean }[];
  mostPopular?: boolean;
  cta: string;
  isCustom?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: "Starter",
    id: "tier-starter",
    href: "/signup?tier=starter",
    price: { weekly: "$0", monthly: "$0", annually: "$0" },
    description: "Get started with our basic features, completely free.",
    features: [
      { text: "Up to 5 saved searches per month" },
      { text: "Up to 2 locations per search" },
      { text: "Standard email support" },
      { text: "Weekly search cadence" },
      { text: "Priority email support", unavailable: true },
      { text: "Chat support", unavailable: true },
      { text: "Daily search cadence", unavailable: true },
      { text: "Hourly search cadence", unavailable: true },
      { text: "API Access", unavailable: true },
      { text: "Dedicated account manager", unavailable: true },
    ],
    cta: "Get Started",
  },
  {
    name: "Plus",
    id: "tier-plus",
    href: "/signup?tier=plus",
    price: { weekly: "$1.49", monthly: "$4.99", annually: "$49.00" },
    description: "Perfect for friends, families, and small teams.",
    features: [
      { text: "Up to 20 saved searches per month" },
      { text: "Up to 3 locations per search" },
      { text: "Ad-free experience" },
      { text: "Save up to 10 favorite locations" },
      { text: "Priority email support" },
      { text: "Real-time traffic data", unavailable: true },
      { text: "Unlimited saved searches", unavailable: true },
      { text: "API Access", unavailable: true },
      { text: "Dedicated account manager", unavailable: true },
    ],
    cta: "Choose Plus",
    mostPopular: true,
  },
  {
    name: "Pro",
    id: "tier-pro",
    href: "/signup?tier=pro",
    price: { weekly: "$4.99", monthly: "$19.00", annually: "$190.00" },
    description: "Advanced features for professionals and power users.",
    features: [
      { text: "Unlimited saved searches" },
      { text: "Up to 5 locations per search" },
      { text: "Real-time traffic data for accurate ETAs" },
      { text: "Ad-free experience" },
      { text: "Unlimited saved locations" },
      { text: "Advanced route optimization" },
      { text: "Priority email support" },
      { text: "API Access", unavailable: true },
      { text: "Dedicated account manager", unavailable: true },
    ],
    cta: "Choose Pro",
  },
  {
    name: "Business",
    id: "tier-business",
    href: "/signup?tier=business",
    price: { weekly: "$24.99", monthly: "$99.00", annually: "$990.00" },
    description: "Complete solution for teams and enterprises.",
    features: [
      { text: "All Pro features" },
      { text: "Up to 10 locations per search" },
      { text: "5 user seats included" },
      { text: "Team management dashboard" },
      { text: "Priority support & training" },
      { text: "API Access" },
      { text: "Custom integrations" },
      { text: "Dedicated account manager" },
      { text: "Advanced analytics" },
    ],
    cta: "Choose Business",
    isCustom: false,
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

  const getPriceSuffix = (cycle: Cadence) => {
    if (cycle === "weekly") return "/week";
    if (cycle === "monthly") return "/month";
    if (cycle === "annually") return "/year";
    return "";
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12 sm:py-16">
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
                 <Button asChild className="w-full" variant={tier.mostPopular ? 'default' : 'outline'} size="lg">
                  <Link href={tier.href}>
                    {tier.cta}
                    {isRedirectingToStripeForTier(tier.id, billingCycle) && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Day Pass Option */}
        <div className="mt-16 text-center">
          <div className="mx-auto max-w-lg rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white shadow-xl">
            <h3 className="text-2xl font-bold">Need Pro Features for a Day?</h3>
            <p className="mt-4 text-blue-100">
              Get 24-hour access to all Pro features including real-time traffic data and up to 5 locations.
            </p>
            <div className="mt-6">
              <span className="text-4xl font-bold">$1.99</span>
              <span className="text-lg text-blue-100"> for 24 hours</span>
            </div>
            <Button asChild className="mt-6 bg-white text-blue-600 hover:bg-blue-50" size="lg">
              <Link href="/signup?tier=daypass">
                Get Day Pass
              </Link>
            </Button>
            <p className="mt-3 text-sm text-blue-200">
              Perfect for events, road trips, or testing Pro features
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
          <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { q: "Can I change my plan later?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated." },
              { q: "What payment methods do you accept?", a: "We accept all major credit cards. For Business plans, we can also arrange invoicing." },
              { q: "Is there a discount for annual billing?", a: "Yes, you save approximately 17% (equivalent to 2 months free) by choosing an annual plan over monthly." },
              { q: "What happens if I exceed my plan limits?", a: "For metered features like saved searches, you'll be prompted to upgrade if you consistently exceed limits." },
              { q: "Do you offer refunds?", a: "We offer a 14-day money-back guarantee on all paid plans." },
              { q: "How does support work?", a: "Support channels vary by plan, ranging from standard email to dedicated account managers for Business clients." },
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

const isRedirectingToStripeForTier = (tierId: string, cadence: Cadence) => {
  console.log(`Checking redirect state for ${tierId} with ${cadence} billing`);
  return false; 
};

const STRIPE_PRICE_IDS = {
  starter: {
    monthly: "starter_monthly"
  },
  plus: {
    weekly: "plus_weekly",
    monthly: "plus_monthly",
    annually: "plus_yearly"
  },
  pro: {
    weekly: "pro_weekly",
    monthly: "pro_monthly",
    annually: "pro_yearly"
  },
  business: {
    weekly: "business_weekly",
    monthly: "business_monthly",
    annually: "business_yearly"
  }
};

function getStripePriceId(tierName: Tier, cadence: Cadence): string | null {
  if (tierName === "Starter") {
    if (cadence === "monthly") return STRIPE_PRICE_IDS.starter.monthly;
    return null;
  } else if (tierName === "Plus") {
    return STRIPE_PRICE_IDS.plus[cadence];
  } else if (tierName === "Pro") {
    return STRIPE_PRICE_IDS.pro[cadence];
  } else if (tierName === "Business") {
    return STRIPE_PRICE_IDS.business[cadence];
  }
  return null;
} 