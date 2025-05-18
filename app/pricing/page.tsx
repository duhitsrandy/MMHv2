'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { createCheckoutSession, createBillingPortalSessionAction } from '@/actions/stripe/createCheckoutSession';
// TODO: Import action for creating Stripe Billing Portal session
// import { createBillingPortalSessionAction } from '@/actions/stripe/createBillingPortalSessionAction'; 
import { usePlan } from '@/hooks/usePlan'; // Assuming this hook tells us if the user is 'free' or 'pro'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle2, Loader2, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { TIER_DETAILS, TierName, Cadence } from '@/lib/stripe/tier-map';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface TierFeatureProps {
  text: string;
}

const TierFeature: React.FC<TierFeatureProps> = ({ text }) => (
  <li className="flex items-start">
    <CheckCircle2 className="mr-2 mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
    <span>{text}</span>
  </li>
);

const getPriceIdForTierAndCadence = (tierName: TierName, cadence: Cadence): string | undefined => {
  const tier = TIER_DETAILS[tierName];
  if ('stripePriceIds' in tier && tier.stripePriceIds) {
    return (tier.stripePriceIds as any)[cadence];
  }
  return undefined;
};

const getDisplayPriceForTierAndCadence = (tierName: TierName, cadence: Cadence): string => {
  const tier = TIER_DETAILS[tierName];
  if (tierName === 'starter') return "$0";
  if ('displayPrices' in tier && tier.displayPrices) {
    const price = (tier.displayPrices as any)[cadence];
    let cadenceText = "/month";
    if (cadence === 'weekly') cadenceText = "/week";
    if (cadence === 'yearly') cadenceText = "/year"; // Price should be total yearly for display
    
    // For yearly, TIER_DETAILS.displayPrices.yearly is the total annual price
    // If we want to show per month equivalent for yearly, we can calculate it here.
    // For example: if (cadence === 'yearly') return `$${(price / 12).toFixed(2)}/month (billed annually)`;
    return `$${price}${cadenceText}`;
  }
  return "N/A";
};

export default function PricingPage() {
  const { user, isSignedIn } = useUser();
  const { tier: currentTier, planInfo, isLoading: isPlanLoading, error: planError } = usePlan();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState<string | false>(false); // priceId or false
  const [selectedCadence, setSelectedCadence] = useState<Cadence>('monthly');

  const handleCheckout = async (tierName: TierName) => {
    if (!isSignedIn) {
      router.push('/login?redirect_url=/pricing');
      return;
    }

    const priceId = getPriceIdForTierAndCadence(tierName, selectedCadence);
    if (!priceId) {
      toast.error("Pricing information not available for this selection.");
      return;
    }

    setIsRedirecting(priceId);
    try {
      // The createCheckoutSession action now needs to accept priceId directly
      const result = await createCheckoutSession({ priceId }); 
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Could not initiate upgrade. Please try again.");
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsRedirecting(false);
    }
  };
  
  const handleManageSubscription = async () => {
    setIsRedirecting("manage");
    toast.info("Redirecting to manage your subscription...");
    try {
      const result = await createBillingPortalSessionAction(); 
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Could not open billing portal. Please try again.");
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error("Manage subscription error:", error);
      toast.error("An unexpected error occurred while opening the billing portal.");
      setIsRedirecting(false);
    }
  };

  if (isPlanLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (planError) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-destructive mb-4">Error Loading Plans</h1>
        <p>{planError.message}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  const tiersToDisplay: TierName[] = ['starter', 'plus', 'pro', 'business'];

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Find the Plan That's Right For You
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Simple, flexible pricing for individuals and teams.
        </p>
      </header>

      <div className="flex justify-center mb-10">
        <RadioGroup defaultValue="monthly" onValueChange={(val) => setSelectedCadence(val as Cadence)} className="grid grid-cols-3 gap-x-2 rounded-lg bg-muted p-1 text-muted-foreground">
          <div><RadioGroupItem value="weekly" id="weekly" className="sr-only" /><Label htmlFor="weekly" className="block w-full cursor-pointer rounded-md py-2 px-3 text-center ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-background data-[state=checked]:text-foreground hover:bg-accent hover:text-accent-foreground">Weekly</Label></div>
          <div><RadioGroupItem value="monthly" id="monthly" className="sr-only" /><Label htmlFor="monthly" className="block w-full cursor-pointer rounded-md py-2 px-3 text-center ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-background data-[state=checked]:text-foreground hover:bg-accent hover:text-accent-foreground">Monthly</Label></div>
          <div><RadioGroupItem value="yearly" id="yearly" className="sr-only" /><Label htmlFor="yearly" className="block w-full cursor-pointer rounded-md py-2 px-3 text-center ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-background data-[state=checked]:text-foreground hover:bg-accent hover:text-accent-foreground">Annual (Save ~15%)</Label></div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {tiersToDisplay.map((tierKey) => {
          const tier = TIER_DETAILS[tierKey];
          const priceId = getPriceIdForTierAndCadence(tierKey, selectedCadence);
          const displayPrice = getDisplayPriceForTierAndCadence(tierKey, selectedCadence);
          const isCurrentPlan = currentTier === tierKey;

          return (
            <Card key={tierKey} className={`flex flex-col ${tierKey === 'pro' ? 'border-blue-500 border-2 shadow-xl' : ''}`}>
              <CardHeader className="pb-4">
                <CardTitle className={`text-2xl font-semibold ${tierKey === 'pro' ? 'text-blue-600' : ''}`}>{tier.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{tier.description}</CardDescription>
                 <p className="text-3xl font-bold pt-2">
                  {displayPrice}
                  {tierKey !== 'starter' && selectedCadence === 'yearly' && tier.displayPrices && 'yearly' in tier.displayPrices && TIER_DETAILS[tierKey].displayPrices.monthly > 0 &&
                    <span className="text-xs font-normal text-muted-foreground block">
                      equiv. $${(TIER_DETAILS[tierKey].displayPrices.yearly / 12).toFixed(2)}/month, billed annually
                    </span>
                  }
                </p>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2.5 text-sm">
                  {tier.features.map((feature, idx) => <TierFeature key={idx} text={feature} />)}
                </ul>
                 {tierKey === 'business' && 
                    <p className="text-xs text-muted-foreground mt-3 flex items-center">
                        <Info size={14} className="mr-1 shrink-0" /> Price shown is per seat. Includes 5 seats.
                    </p>}
              </CardContent>
              <CardFooter className="mt-auto pt-4">
                {tierKey === 'starter' ? (
                  <Button asChild className="w-full" variant={isCurrentPlan ? "outline" : "default"} disabled={isCurrentPlan && isSignedIn}>
                    {isCurrentPlan && isSignedIn ? "Your Current Plan" : <Link href="/signup">Get Started</Link>}
                  </Button>
                ) : isCurrentPlan ? (
                  <Button onClick={handleManageSubscription} className="w-full" disabled={isRedirecting === 'manage'}>
                    {isRedirecting === 'manage' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                    Manage Subscription
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleCheckout(tierKey)}
                    className={`w-full ${tierKey === 'pro' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    disabled={isRedirecting === priceId || !priceId}
                  >
                    {isRedirecting === priceId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {currentTier === 'starter' || !isSignedIn ? `Get ${tier.name}` : `Switch to ${tier.name}`}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      <p className="text-center text-sm text-muted-foreground mt-12">
        All prices in USD. Features and pricing subject to change. 
        By subscribing, you agree to our <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
      </p>
    </div>
  );
} 