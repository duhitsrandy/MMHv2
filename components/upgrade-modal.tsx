import React, { useState, useEffect } from 'react';
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  requiredTier?: 'plus' | 'pro' | 'business';
  showAllPlans?: boolean; // If true, shows comparison of multiple tiers
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose, 
  feature = "additional locations",
  requiredTier = "plus",
  showAllPlans = false
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedTier, setSelectedTier] = useState(requiredTier);
  const { trackUpgradePrompt, track } = useAnalytics();

  // Tier configurations matching your pricing page
  const tierConfigs = {
    plus: {
      name: "Plus",
      price: "$4.99",
      features: [
        "Up to 3 locations per search",
        "Ad-free experience", 
        "Basic route calculations",
        "Points of interest discovery",
        "Priority email support"
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY || "price_plus_monthly"
    },
    pro: {
      name: "Pro", 
      price: "$19.00",
      features: [
        "Up to 5 locations per search",
        "Real-time traffic data for accurate ETAs",
        "Advanced route optimization", 
        "Ad-free experience",
        "Priority email support"
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly"
    },
    business: {
      name: "Business",
      price: "$99.00",
      features: [
        "Up to 10 locations per search",
        "All Pro features",
        "Real-time traffic data",
        "Advanced route optimization",
        "Priority email support",
        "Team collaboration features",
        "Enhanced analytics"
      ],
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY || "price_business_monthly"
    }
  };

  const config = tierConfigs[requiredTier];

  // Track when upgrade modal is shown
  useEffect(() => {
    if (isOpen) {
      trackUpgradePrompt(
        feature.includes('location') ? 'add_location' : 'feature_limit',
        feature.includes('location') ? 'location_limit' : 'feature_limit'
      );
    }
  }, [isOpen, feature, trackUpgradePrompt]);

  if (!isOpen) {
    return null;
  }

  const handleUpgrade = async (tierToUpgrade = selectedTier) => {
    // Track upgrade button click
    track('upgrade_button_clicked', {
      trigger_source: feature.includes('location') ? 'add_location' : 'feature_limit',
      current_plan: requiredTier,
      target_plan: tierToUpgrade,
    });

    setIsRedirecting(true);
    try {
      const upgradeConfig = tierConfigs[tierToUpgrade];
      if (!upgradeConfig.priceId) {
        toast.error("Pricing configuration error. Please contact support.");
        setIsRedirecting(false);
        return;
      }

      const result = await createCheckoutSession({ priceId: upgradeConfig.priceId });

      if (result.url) {
        window.location.href = result.url;
      } else if (result.error) {
        toast.error(result.error);
        setIsRedirecting(false);
      } else {
        toast.error("Could not initiate upgrade. Please try again.");
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsRedirecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upgrade to {config.name}
          </h2>
          <p className="text-gray-600 mb-6">
            {showAllPlans 
              ? "Choose the plan that fits your needs:"
              : `You need ${feature} which requires ${config.name} plan or higher.`
            }
          </p>
          
          {showAllPlans ? (
            /* Multi-Plan Comparison */
            <div className="space-y-4 mb-6">
              {Object.entries(tierConfigs).filter(([key]) => key !== 'business').map(([tierKey, tierConfig]) => (
                <div 
                  key={tierKey}
                  onClick={() => setSelectedTier(tierKey as 'plus' | 'pro')}
                  className={`rounded-lg p-4 border-2 transition-all cursor-pointer hover:border-blue-300 ${
                    tierKey === selectedTier 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{tierConfig.name}</h3>
                      {tierKey === requiredTier && (
                        <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                          Minimum Required
                        </span>
                      )}
                      {tierKey === selectedTier && tierKey !== requiredTier && (
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{tierConfig.price}</div>
                      <div className="text-sm text-gray-500">per month</div>
                    </div>
                  </div>
                  
                  <ul className="space-y-2 text-sm">
                    {tierConfig.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            /* Single Plan Details */
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{config.name} Plan</h3>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{config.price}</div>
                  {config.price !== "Custom" && (
                    <div className="text-sm text-gray-500">per month</div>
                  )}
                </div>
              </div>
              
              {/* Features List */}
              <ul className="space-y-3">
                {config.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Tier Preview (if showing Plus, hint at Pro) */}
          {requiredTier === 'plus' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Need even more?</h4>
                  <p className="text-sm text-gray-600">Pro plan includes traffic data + up to 5 locations</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">$19.00</div>
                  <div className="text-xs text-gray-500">per month</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={isRedirecting}
              >
                Maybe Later
              </button>
              <button
                onClick={() => handleUpgrade()}
                className="px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center justify-center transition-colors disabled:opacity-50"
                disabled={isRedirecting}
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedTier === 'business' ? 'Redirecting...' : 'Processing...'}
                  </>
                ) : (
                  selectedTier === 'business' ? 'Contact Sales' : `Upgrade to ${tierConfigs[selectedTier].name}`
                )}
              </button>
            </div>
            
            {/* Link to Full Pricing */}
            <div className="text-center">
              <button
                onClick={() => {
                  window.location.href = '/pricing';
                }}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
                disabled={isRedirecting}
              >
                Compare all plans and features
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal; 