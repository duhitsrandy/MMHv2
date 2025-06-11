"use client"

import { useState, useEffect } from 'react'
import { usePlan } from '@/hooks/usePlan'
import { useAnalytics } from '@/hooks/useAnalytics'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdBannerProps {
  placement: 'sidebar' | 'results-top' | 'results-bottom' | 'between-pois'
  className?: string
}

export function AdBanner({ placement, className = '' }: AdBannerProps) {
  const { tier, isLoading } = usePlan()
  const { track } = useAnalytics()
  const [isVisible, setIsVisible] = useState(true)
  const [adLoaded, setAdLoaded] = useState(false)

  // Only show ads for starter (free) tier users
  const shouldShowAds = !isLoading && tier === 'starter'

  useEffect(() => {
    if (shouldShowAds && isVisible) {
      // Track ad impression
      track(ANALYTICS_EVENTS.AD_IMPRESSION, {
        placement,
        ad_network: 'google_adsense', // or your chosen network
      })

      // Initialize ad loading
      initializeAd()
    }
  }, [shouldShowAds, isVisible, placement, track])

  const initializeAd = () => {
    // Google AdSense implementation
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        setAdLoaded(true)
      }
    } catch (error) {
      console.error('Ad loading failed:', error)
      // Track ad failure
      track(ANALYTICS_EVENTS.AD_LOAD_FAILED, { 
        placement, 
        ad_network: 'google_adsense',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  const handleAdClick = () => {
    track(ANALYTICS_EVENTS.AD_CLICKED, {
      placement,
      ad_network: 'google_adsense',
    })
  }

  const handleDismiss = () => {
    setIsVisible(false)
    track(ANALYTICS_EVENTS.AD_DISMISSED, { 
      placement,
      ad_network: 'google_adsense'
    })
  }

  // Don't render anything for paid users
  if (!shouldShowAds || !isVisible) {
    return null
  }

  const getAdDimensions = () => {
    switch (placement) {
      case 'sidebar':
        return { width: '300px', height: '250px' } // Medium Rectangle
      case 'results-top':
      case 'results-bottom':
        return { width: '728px', height: '90px' } // Leaderboard
      case 'between-pois':
        return { width: '320px', height: '100px' } // Mobile Banner
      default:
        return { width: '300px', height: '250px' }
    }
  }

  const { width, height } = getAdDimensions()

  return (
    <div className={`relative bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Dismiss button for better UX */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Ad Label */}
      <div className="text-xs text-gray-500 mb-2 font-medium">Advertisement</div>

      {/* Google AdSense Ad Unit */}
      <div 
        className="flex items-center justify-center"
        style={{ width, height }}
        onClick={handleAdClick}
      >
        <ins
          className="adsbygoogle"
          style={{
            display: 'inline-block',
            width,
            height,
          }}
          data-ad-client="ca-pub-YOUR_PUBLISHER_ID" // Replace with your AdSense ID
          data-ad-slot="YOUR_AD_SLOT_ID" // Replace with your ad slot ID
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>

      {/* Fallback content if ads don't load */}
      {!adLoaded && (
        <div 
          className="flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded"
          style={{ width, height }}
        >
          <div className="text-center p-4">
            <div className="text-sm font-semibold text-blue-800 mb-2">
              ✨ Upgrade to Remove Ads
            </div>
            <div className="text-xs text-blue-600">
              Get Plus plan starting at $9/month
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Higher-order component for conditional ad display
export function withAds<P extends object>(
  Component: React.ComponentType<P>,
  adPlacement: AdBannerProps['placement']
) {
  return function AdWrappedComponent(props: P) {
    return (
      <>
        {adPlacement === 'results-top' && <AdBanner placement={adPlacement} className="mb-4" />}
        <Component {...props} />
        {adPlacement === 'results-bottom' && <AdBanner placement={adPlacement} className="mt-4" />}
      </>
    )
  }
} 