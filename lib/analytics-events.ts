// Centralized Analytics Events for Meet Me Halfway
// This file defines all PostHog events for consistent tracking

export const ANALYTICS_EVENTS = {
  // === USER JOURNEY ===
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // === CORE FUNCTIONALITY ===
  SEARCH_STARTED: 'search_started',
  SEARCH_COMPLETED: 'search_completed',
  SEARCH_FAILED: 'search_failed',
  LOCATION_ADDED: 'location_added',
  LOCATION_REMOVED: 'location_removed',
  
  // === PREMIUM FEATURES ===
  TRAFFIC_TOGGLE_ENABLED: 'traffic_toggle_enabled',
  TRAFFIC_TOGGLE_DISABLED: 'traffic_toggle_disabled',
  MULTI_LOCATION_SEARCH: 'multi_location_search', // 3+ locations
  
  // === UPGRADE FLOW ===
  UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
  UPGRADE_BUTTON_CLICKED: 'upgrade_button_clicked',
  PRICING_PAGE_VIEWED: 'pricing_page_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  
  // === ENGAGEMENT ===
  POI_CLICKED: 'poi_clicked',
  POI_FAVORITED: 'poi_favorited',
  POI_UNFAVORITED: 'poi_unfavorited',
  POI_FILTER_CHANGED: 'poi_filter_changed',
  POI_FAVORITES_TOGGLED: 'poi_favorites_toggled',
  POI_EXTERNAL_LINK_CLICKED: 'poi_external_link_clicked',
  MAP_ZOOMED: 'map_zoomed',
  ROUTE_TOGGLED: 'route_toggled', // main/alternate
  
  // === ERRORS & PERFORMANCE ===
  API_ERROR: 'api_error',
  GEOCODING_FAILED: 'geocoding_failed',
  ROUTING_FAILED: 'routing_failed',
  SLOW_SEARCH: 'slow_search', // >5 seconds
  
  // === RETENTION ===
  SAVED_SEARCH_CREATED: 'saved_search_created',
  SAVED_SEARCH_LOADED: 'saved_search_loaded',
  RETURN_VISIT: 'return_visit', // 2+ days since last visit
  
  // === AD MONETIZATION ===
  AD_IMPRESSION: 'ad_impression',
  AD_CLICKED: 'ad_clicked',
  AD_DISMISSED: 'ad_dismissed',
  AD_LOAD_FAILED: 'ad_load_failed',
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// Common properties for events
export interface BaseEventProperties {
  plan: 'starter' | 'plus' | 'pro' | 'business';
  user_id?: string;
  session_id?: string;
  page_url?: string;
  [key: string]: any;
}

// Specific event property interfaces
export interface SearchEventProperties extends BaseEventProperties {
  location_count: number;
  has_traffic_enabled?: boolean;
  search_duration_ms?: number;
  origin_types?: ('address' | 'coordinates' | 'poi')[];
}

export interface UpgradeEventProperties extends BaseEventProperties {
  trigger_source: 'add_location' | 'traffic_toggle' | 'pricing_page' | 'manual';
  current_plan: string;
  target_plan?: string;
  barrier_hit?: 'location_limit' | 'feature_limit';
}

export interface POIEventProperties extends BaseEventProperties {
  poi_id: string;
  poi_name: string;
  poi_category: string;
  poi_rating?: number;
  user_location_count: number;
}

export interface AdEventProperties extends BaseEventProperties {
  placement: 'sidebar' | 'results-top' | 'results-bottom' | 'between-pois';
  ad_network: string;
  error?: string;
} 