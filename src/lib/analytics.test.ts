import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createAnalyticsEvent,
  flushAnalyticsQueue,
  getQueuedEvents,
  getStoredEvents,
  sanitizeSearchQuery,
  trackEvent,
} from './analytics';

describe('analytics helpers', () => {
  afterEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    delete process.env.NEXT_PUBLIC_ANALYTICS_DISABLED;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('creates an event with anonymous ids, timestamp, safe context, and metadata', () => {
    window.history.replaceState({}, '', '/?utm_source=newsletter&utm_campaign=launch');
    const event = createAnalyticsEvent('content_open', {
      contentId: 'video-1',
      metadata: { source: 'feed' },
    });

    expect(event.eventType).toBe('content_open');
    expect(event.eventId).toMatch(/^clp_evt_/);
    expect(event.eventVersion).toBe(1);
    expect(event.contentId).toBe('video-1');
    expect(event.visitorId).toMatch(/^clp_visitor_/);
    expect(event.sessionId).toMatch(/^clp_session_/);
    expect(event.metadata).toEqual({ source: 'feed' });
    expect(event.context).toMatchObject({
      deviceType: 'desktop',
      pagePath: '/',
      utmSource: 'newsletter',
      utmCampaign: 'launch',
    });
    expect(Date.parse(event.timestamp)).not.toBeNaN();
  });

  it('stores tracked events in the debug log and durable queue', () => {
    trackEvent('learn_more_open', { contentId: 'playbook-1' });
    trackEvent('like', { contentId: 'playbook-1' });

    expect(getStoredEvents()).toHaveLength(2);
    expect(getStoredEvents().map((event) => event.eventType)).toEqual(['learn_more_open', 'like']);
    expect(getQueuedEvents()).toHaveLength(2);
  });

  it('flushes queued events to the analytics API and clears them after success', async () => {
    const fetchMock = vi.fn(async (...args: Parameters<typeof fetch>) => {
      void args;
      return new Response(JSON.stringify({ ok: true, accepted: 2 }), { status: 202 });
    });
    vi.stubGlobal('fetch', fetchMock);

    trackEvent('learn_more_open', { contentId: 'playbook-1' });
    trackEvent('like', { contentId: 'playbook-1' });

    await flushAnalyticsQueue();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics', expect.objectContaining({ method: 'POST' }));
    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(requestInit.body as string);
    expect(body.events).toHaveLength(2);
    expect(body.events[0]).toMatchObject({ eventType: 'learn_more_open', contentId: 'playbook-1' });
    expect(getQueuedEvents()).toHaveLength(0);
  });

  it('leaves queued events in place when the analytics API rejects them', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: false }), { status: 500 })));

    trackEvent('share', { contentId: 'video-1' });
    await flushAnalyticsQueue();

    expect(getQueuedEvents()).toHaveLength(1);
    expect(getQueuedEvents()[0].eventType).toBe('share');
  });

  it('caps the durable queue at 100 events', () => {
    for (let index = 0; index < 105; index += 1) {
      trackEvent('feed_impression', { contentId: `content-${index}` });
    }

    const queued = getQueuedEvents();
    expect(queued).toHaveLength(100);
    expect(queued[0].contentId).toBe('content-5');
    expect(queued[99].contentId).toBe('content-104');
  });

  it('does not capture events when analytics are disabled', () => {
    process.env.NEXT_PUBLIC_ANALYTICS_DISABLED = 'true';

    trackEvent('entry_view');

    expect(getStoredEvents()).toHaveLength(0);
    expect(getQueuedEvents()).toHaveLength(0);
  });

  it('sanitizes search query text before it is stored in metadata', () => {
    expect(sanitizeSearchQuery('  Email me at Student.Name@example.com about 613-555-0199  ')).toBe(
      'email me at [redacted-email] about [redacted-phone]'
    );
  });
});
