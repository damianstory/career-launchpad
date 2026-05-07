export type CategorySlug =
  | 'emerging-careers'
  | 'on-the-job'
  | 'life-skills'
  | 'mindsets'
  | 'how-i-got-here'
  | 'problems-to-solve'
  | 'post-secondary'
  | 'job-board';

export type ContentFormat = 'video' | 'article' | 'playbook';

export interface LaunchpadContent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: CategorySlug;
  format: ContentFormat;
  thumbnailUrl: string;
  mediaUrl?: string;
  articleUrl?: string;
  durationSeconds?: number;
  playbookContent?: string[];
  learnMore: {
    whyItMatters: string;
    planningConnection: string;
    takeaway: string;
    relatedContentIds: string[];
  };
}

export interface ContentFilters {
  category: CategorySlug | null;
  format: ContentFormat | null;
}

export type AnalyticsEventType =
  | 'entry_view'
  | 'feed_impression'
  | 'content_open'
  | 'video_play'
  | 'video_progress'
  | 'learn_more_open'
  | 'category_filter'
  | 'format_filter'
  | 'save'
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
