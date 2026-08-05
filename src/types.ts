export type CategorySlug =
  | 'emerging-careers'
  | 'on-the-job'
  | 'life-skills'
  | 'mindsets'
  | 'how-i-got-here'
  | 'problems-to-solve'
  | 'post-secondary'
  | 'job-board'
  | 'skills-canada';

export type ContentFormat = 'video' | 'article';

export type VideoOrientation = 'vertical' | 'horizontal';

export interface LaunchpadCategory {
  slug: CategorySlug;
  name: string;
  displayOrder: number;
}

export interface LaunchpadContent {
  id: string;
  slug: string;
  title: string;
  description: string;
  categories: CategorySlug[];
  primaryCategory: CategorySlug;
  format: ContentFormat;
  thumbnailUrl: string;
  publishedAt: string;
  mediaUrl?: string;
  articleUrl?: string;
  articleSourceName?: string;
  durationSeconds?: number;
  videoOrientation?: VideoOrientation;
  readingTimeMinutes?: number;
  learnMore: {
    whyItMatters?: string;
    planningConnection?: string;
    takeaway?: string;
    reflection: string;
    relatedContentIds: string[];
  };
}

export interface ContentFilters {
  categories: CategorySlug[];
  format: ContentFormat | null;
}

export const ANALYTICS_EVENT_TYPES = [
  'session_start',
  'entry_view',
  'feed_impression',
  'content_open',
  'video_play',
  'video_progress',
  'video_pause',
  'video_complete',
  'video_audio_recovery',
  'learn_more_open',
  'category_filter',
  'format_filter',
  'like',
  'share',
  'related_content_click',
  'outbound_click',
  'search_open',
  'search_query',
  'search_zero_results',
  'search_result_click',
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export type AnalyticsDeviceType = 'desktop' | 'tablet' | 'mobile' | 'unknown';

export interface AnalyticsEventContext {
  deviceType: AnalyticsDeviceType;
  pagePath: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export interface AnalyticsEvent {
  eventId: string;
  eventVersion: 1;
  eventType: AnalyticsEventType;
  timestamp: string;
  visitorId: string;
  sessionId: string;
  contentId?: string;
  metadata?: Record<string, unknown>;
  context: AnalyticsEventContext;
}
