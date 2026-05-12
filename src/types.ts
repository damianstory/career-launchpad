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

export type ContentFormat = 'video' | 'article' | 'playbook';

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
    relatedContentIds: string[];
  };
}

export interface ContentFilters {
  categories: CategorySlug[];
  format: ContentFormat | null;
}

export type AnalyticsEventType =
  | 'entry_view'
  | 'feed_impression'
  | 'content_open'
  | 'video_play'
  | 'video_progress'
  | 'video_complete'
  | 'learn_more_open'
  | 'category_filter'
  | 'format_filter'
  | 'like'
  | 'share'
  | 'related_content_click'
  | 'outbound_click';

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  timestamp: string;
  sessionId: string;
  contentId?: string;
  metadata?: Record<string, unknown>;
}
