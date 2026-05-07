import type { AnalyticsEvent, AnalyticsEventType } from '@/types';

const SESSION_KEY = 'career-launchpad-session-id';
const EVENT_KEY = 'career-launchpad-events';

function createSessionId(): string {
  return `clp_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';

  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const next = createSessionId();
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

export function createAnalyticsEvent(
  eventType: AnalyticsEventType,
  options: { contentId?: string; metadata?: Record<string, unknown> } = {}
): AnalyticsEvent {
  return {
    eventType,
    contentId: options.contentId,
    metadata: options.metadata,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
  };
}

export function getStoredEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(EVENT_KEY);
    return stored ? (JSON.parse(stored) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

export function trackEvent(
  eventType: AnalyticsEventType,
  options: { contentId?: string; metadata?: Record<string, unknown> } = {}
): void {
  if (typeof window === 'undefined') return;

  const event = createAnalyticsEvent(eventType, options);
  const nextEvents = [...getStoredEvents(), event].slice(-200);
  window.localStorage.setItem(EVENT_KEY, JSON.stringify(nextEvents));
  window.dispatchEvent(new CustomEvent('career-launchpad-analytics', { detail: event }));
}
