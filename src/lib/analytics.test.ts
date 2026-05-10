import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAnalyticsEvent, getStoredEvents, trackEvent } from './analytics';

describe('analytics helpers', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('creates an event with timestamp, session id, and metadata', () => {
    const event = createAnalyticsEvent('content_open', {
      contentId: 'video-1',
      metadata: { source: 'feed' },
    });

    expect(event.eventType).toBe('content_open');
    expect(event.contentId).toBe('video-1');
    expect(event.sessionId).toMatch(/^clp_/);
    expect(event.metadata).toEqual({ source: 'feed' });
    expect(Date.parse(event.timestamp)).not.toBeNaN();
  });

  it('stores tracked events without throwing', () => {
    trackEvent('learn_more_open', { contentId: 'playbook-1' });
    trackEvent('like', { contentId: 'playbook-1' });

    expect(getStoredEvents()).toHaveLength(2);
    expect(getStoredEvents().map((event) => event.eventType)).toEqual(['learn_more_open', 'like']);
  });
});
