'use client';

import { usePostHog } from 'posthog-js/react';
import { useUser } from '@clerk/nextjs';
import { usePlan } from './usePlan';
import { ANALYTICS_EVENTS, type AnalyticsEvent, type BaseEventProperties } from '@/lib/analytics-events';

export function useAnalytics() {
  const posthog = usePostHog();
  const { user } = useUser();
  const { tier: plan } = usePlan();

  const track = (event: AnalyticsEvent, properties?: Record<string, any>) => {
    if (!posthog) return;

    const baseProperties: BaseEventProperties = {
      plan: plan || 'starter',
      user_id: user?.id,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...properties,
    };

    posthog.capture(event, baseProperties);
  };

  // Convenience methods for common events
  const trackSearch = (locationCount: number, duration?: number, hasTraffic?: boolean) => {
    track(ANALYTICS_EVENTS.SEARCH_STARTED, {
      location_count: locationCount,
      search_duration_ms: duration,
      has_traffic_enabled: hasTraffic,
    });
  };

  const trackUpgradePrompt = (triggerSource: string, barrierHit?: string) => {
    track(ANALYTICS_EVENTS.UPGRADE_PROMPT_SHOWN, {
      trigger_source: triggerSource,
      current_plan: plan,
      barrier_hit: barrierHit,
    });
  };

  const trackPOIInteraction = (action: 'clicked' | 'favorited' | 'unfavorited', poi: any) => {
    const eventMap = {
      clicked: ANALYTICS_EVENTS.POI_CLICKED,
      favorited: ANALYTICS_EVENTS.POI_FAVORITED,
      unfavorited: ANALYTICS_EVENTS.POI_UNFAVORITED,
    };

    track(eventMap[action], {
      poi_id: poi.id || poi.osm_id,
      poi_name: poi.name || poi.display_name,
      poi_category: poi.category,
      poi_rating: poi.rating,
    });
  };

  const trackLocationChange = (action: 'added' | 'removed', newCount: number) => {
    const event = action === 'added' ? ANALYTICS_EVENTS.LOCATION_ADDED : ANALYTICS_EVENTS.LOCATION_REMOVED;
    track(event, {
      location_count: newCount,
      action,
    });
  };

  // Identify user when they sign up/login
  const identifyUser = (userId: string, properties?: Record<string, any>) => {
    if (!posthog) return;
    
    posthog.identify(userId, {
      plan,
      signup_date: new Date().toISOString(),
      ...properties,
    });
  };

  return {
    track,
    trackSearch,
    trackUpgradePrompt,
    trackPOIInteraction,
    trackLocationChange,
    identifyUser,
    // Direct access to PostHog instance for advanced usage
    posthog,
  };
} 