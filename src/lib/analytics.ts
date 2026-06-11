import type { AnalyticsEvent, AnalyticsEventType } from '@/types';

const SESSION_KEY = 'career-launchpad-session-id';
const VISITOR_KEY = 'career-launchpad-visitor-id';
const EVENT_KEY = 'career-launchpad-events';
const QUEUE_KEY = 'career-launchpad-analytics-queue';
const ENDPOINT = '/api/analytics';
const EVENT_VERSION = 1;
const DEBUG_EVENT_LIMIT = 200;
const QUEUE_EVENT_LIMIT = 100;
const FLUSH_BATCH_SIZE = 20;
const SEARCH_QUERY_MAX_LENGTH = 80;

let flushTimer: number | null = null;
let isFlushing = false;
let unloadFlushInstalled = false;

function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 18);

  return `${prefix}_${random}_${Date.now().toString(36)}`;
}

function createSessionId(): string {
  return createId('clp_session');
}

function createVisitorId(): string {
  return createId('clp_visitor');
}

function createEventId(): string {
  return createId('clp_evt');
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const next = createSessionId();
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';

  const existing = window.localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;

  const next = createVisitorId();
  window.localStorage.setItem(VISITOR_KEY, next);
  return next;
}

function analyticsDisabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_DISABLED === 'true';
}

function readEvents(key: string): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function writeEvents(key: string, events: AnalyticsEvent[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(events));
}

function getDeviceType(): AnalyticsEvent['context']['deviceType'] {
  if (typeof window === 'undefined') return 'unknown';
  if (!window.matchMedia) return 'desktop';
  if (window.matchMedia('(max-width: 860px)').matches) return 'mobile';
  if (window.matchMedia('(max-width: 1100px)').matches) return 'tablet';
  return 'desktop';
}

function optionalSearchParam(name: string): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = new URL(window.location.href).searchParams.get(name);
  return value?.trim() || undefined;
}

function getReferrerHost(): string | undefined {
  if (typeof document === 'undefined' || !document.referrer) return undefined;

  try {
    return new URL(document.referrer).host;
  } catch {
    return undefined;
  }
}

function createEventContext(): AnalyticsEvent['context'] {
  if (typeof window === 'undefined') {
    return { deviceType: 'unknown', pagePath: '/' };
  }

  return {
    deviceType: getDeviceType(),
    pagePath: window.location.pathname || '/',
    referrerHost: getReferrerHost(),
    utmSource: optionalSearchParam('utm_source'),
    utmMedium: optionalSearchParam('utm_medium'),
    utmCampaign: optionalSearchParam('utm_campaign'),
    utmContent: optionalSearchParam('utm_content'),
    utmTerm: optionalSearchParam('utm_term'),
  };
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[redacted-email]')
    .replace(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g, '[redacted-phone]')
    .slice(0, SEARCH_QUERY_MAX_LENGTH);
}

export function createAnalyticsEvent(
  eventType: AnalyticsEventType,
  options: { contentId?: string; metadata?: Record<string, unknown> } = {}
): AnalyticsEvent {
  return {
    eventId: createEventId(),
    eventVersion: EVENT_VERSION,
    eventType,
    contentId: options.contentId,
    metadata: options.metadata,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
    context: createEventContext(),
  };
}

export function getStoredEvents(): AnalyticsEvent[] {
  return readEvents(EVENT_KEY);
}

export function getQueuedEvents(): AnalyticsEvent[] {
  return readEvents(QUEUE_KEY);
}

function storeDebugEvent(event: AnalyticsEvent): void {
  writeEvents(EVENT_KEY, [...getStoredEvents(), event].slice(-DEBUG_EVENT_LIMIT));
}

function enqueueEvent(event: AnalyticsEvent): void {
  writeEvents(QUEUE_KEY, [...getQueuedEvents(), event].slice(-QUEUE_EVENT_LIMIT));
}

function removeQueuedBatch(batch: AnalyticsEvent[]): void {
  const sentIds = new Set(batch.map((event) => event.eventId));
  writeEvents(
    QUEUE_KEY,
    getQueuedEvents().filter((event) => !sentIds.has(event.eventId))
  );
}

function installUnloadFlush(): void {
  if (typeof window === 'undefined' || unloadFlushInstalled) return;
  unloadFlushInstalled = true;

  window.addEventListener('pagehide', () => {
    const batch = getQueuedEvents().slice(0, FLUSH_BATCH_SIZE);
    if (batch.length === 0) return;

    const body = JSON.stringify({ events: batch });
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      if (sent) removeQueuedBatch(batch);
      return;
    }

    void flushAnalyticsQueue();
  });
}

function scheduleFlush(): void {
  if (typeof window === 'undefined' || flushTimer !== null) return;

  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushAnalyticsQueue();
  }, 250);
}

export async function flushAnalyticsQueue(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined' || isFlushing) return false;

  if (flushTimer !== null) {
    window.clearTimeout(flushTimer);
    flushTimer = null;
  }

  const batch = getQueuedEvents().slice(0, FLUSH_BATCH_SIZE);
  if (batch.length === 0) return true;

  isFlushing = true;
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });

    if (!response.ok) return false;

    removeQueuedBatch(batch);
    if (getQueuedEvents().length > 0) scheduleFlush();
    return true;
  } catch {
    return false;
  } finally {
    isFlushing = false;
  }
}

export function trackEvent(
  eventType: AnalyticsEventType,
  options: { contentId?: string; metadata?: Record<string, unknown> } = {}
): void {
  if (typeof window === 'undefined' || analyticsDisabled()) return;

  const event = createAnalyticsEvent(eventType, options);
  storeDebugEvent(event);
  enqueueEvent(event);
  installUnloadFlush();
  scheduleFlush();
  window.dispatchEvent(new CustomEvent('career-launchpad-analytics', { detail: event }));
}
