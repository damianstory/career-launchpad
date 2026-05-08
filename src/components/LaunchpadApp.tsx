'use client';

import {
  ArrowUpRight,
  BookOpen,
  Brain,
  Briefcase,
  ChevronsDown,
  Clipboard,
  Clock,
  Eye,
  GraduationCap,
  Heart,
  Info,
  LayoutList,
  Lightbulb,
  ListChecks,
  ListFilter,
  MapPin,
  Play,
  Puzzle,
  Rocket,
  Search,
  Share2,
  Sparkles,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  type CSSProperties,
  type ComponentType,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { formats } from '@/data/content';
import {
  applyContentFilters,
  formatDuration,
  getContentBySlug,
  getRelatedContent,
  getYouTubeId,
  orderContentForFeed,
} from '@/lib/content';
import { trackEvent } from '@/lib/analytics';
import type { CategorySlug, ContentFilters, ContentFormat, LaunchpadCategory, LaunchpadContent } from '@/types';

const LearnMorePanel = dynamic(
  () => import('@/components/LearnMorePanel').then((mod) => mod.LearnMorePanel),
  { ssr: false }
);

const SAVED_KEY = 'career-launchpad-saved-content';
const NAVY = '#22224C';
const BLUE = '#0092FF';
const STAGE_BG = '#F6F6FF';
const SURFACE = '#FFFFFF';
const INK = '#22224C';
const INK2 = '#485163';
const BORDER = '#E5E9F1';
const FEED_NUDGE_KEY = 'career-launchpad-feed-nudge-seen';
const FEED_TRANSITION_MS = 280;
const FEED_NAV_LOCK_MS = 320;
const BRAND_MARK_SRC = '/launchpad-logo.svg';

type AutoplayMode = 'audible' | 'muted-fallback';
type FeedDirection = 'next' | 'prev';
type FeedMediaVariant = 'mobile' | 'desktop-immersive';

type IconCmp = ComponentType<{
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
  fill?: string;
}>;

function BrandMark({ size }: { size: number }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'block',
        backgroundImage: `url(${BRAND_MARK_SRC})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
      }}
    />
  );
}

function LearnMoreCta({
  format,
  variant,
  onClick,
}: {
  format: ContentFormat;
  variant: 'mobile' | 'desktop';
  onClick: () => void;
}) {
  const isMobileVariant = variant === 'mobile';
  const isArticle = format === 'article';
  const label = isArticle ? 'Read it' : 'Learn More';

  return (
    <div
      className="learn-more-cta"
      style={{
        position: isMobileVariant ? 'absolute' : 'static',
        left: isMobileVariant ? '50%' : undefined,
        bottom: isMobileVariant ? 'calc(22px + env(safe-area-inset-bottom))' : undefined,
        transform: isMobileVariant ? 'translateX(-50%)' : undefined,
        zIndex: isMobileVariant ? 8 : undefined,
        width: isMobileVariant ? 'min(60vw, 280px)' : 'fit-content',
        minWidth: isMobileVariant ? 220 : undefined,
      }}
    >
      <button
        type="button"
        className="learn-more-cta__button"
        data-testid="learn-more-primary-cta"
        data-variant={variant}
        onClick={onClick}
        style={{
          width: '100%',
          height: isMobileVariant ? 56 : 58,
          borderRadius: 'var(--radius-xl, 16px)',
          fontSize: isMobileVariant ? 15 : 16,
          fontWeight: 800,
          padding: isMobileVariant ? undefined : '0 24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          letterSpacing: 0,
        }}
      >
        {label} <ArrowUpRight size={isMobileVariant ? 16 : 18} />
      </button>
    </div>
  );
}

type YouTubePlayerInstance = {
  playVideo: () => void;
  pauseVideo?: () => void;
  mute: () => void;
  unMute?: () => void;
  destroy: () => void;
};

type YouTubeNamespace = {
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, number>;
      events: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
        onAutoplayBlocked?: () => void;
      };
    }
  ) => YouTubePlayerInstance;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }

  interface Navigator {
    getAutoplayPolicy?: (target: 'mediaelement') => 'allowed' | 'allowed-muted' | 'disallowed';
  }
}

const CATEGORY_ICON: Record<CategorySlug, IconCmp> = {
  'emerging-careers': Rocket,
  'on-the-job': Briefcase,
  'life-skills': Lightbulb,
  mindsets: Brain,
  'how-i-got-here': MapPin,
  'problems-to-solve': Puzzle,
  'post-secondary': GraduationCap,
  'job-board': ListChecks,
};

const CATEGORY_BLOCK_BG: Record<CategorySlug, string> = {
  'emerging-careers': BLUE,
  'on-the-job': NAVY,
  'life-skills': BLUE,
  mindsets: NAVY,
  'how-i-got-here': BLUE,
  'problems-to-solve': NAVY,
  'post-secondary': NAVY,
  'job-board': BLUE,
};

const FORMAT_ICON: Record<ContentFormat, IconCmp> = {
  video: Play,
  article: BookOpen,
  playbook: ListChecks,
};

const FORMAT_LABEL: Record<ContentFormat, string> = {
  video: 'Video',
  article: 'Article',
  playbook: 'Playbook',
};

function readSavedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(SAVED_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

function writeSavedIds(ids: string[]) {
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
}

function categoryLabel(categories: LaunchpadCategory[], slug: CategorySlug): string {
  return categories.find((c) => c.slug === slug)?.name ?? slug;
}

function categoryShortLabel(category: LaunchpadCategory): string {
  if (category.slug === 'emerging-careers') return 'Emerging';
  if (category.slug === 'how-i-got-here') return 'Paths';
  if (category.slug === 'problems-to-solve') return 'Problems';
  if (category.slug === 'job-board') return 'Jobs';
  return category.name;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 860px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return isMobile;
}

function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return reducedMotion;
}

function isInteractiveShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, button, a, [contenteditable="true"]'));
}

function isPlayableContent(item: LaunchpadContent | undefined): boolean {
  return item?.format === 'video' && Boolean(getYouTubeId(item.mediaUrl));
}

function nowMs(): number {
  return Date.now();
}

function loadYouTubeIframeAPI(): Promise<YouTubeNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-career-launchpad-youtube-api]');
    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) resolve(window.YT);
    };

    if (existing) return;

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.dataset.careerLaunchpadYoutubeApi = 'true';
    document.head.appendChild(script);
  });
}

function useFeedNavigation(
  feedRef: RefObject<HTMLElement | null>,
  options: { disabled: boolean; onNavigate: (direction: FeedDirection) => boolean }
) {
  const { disabled, onNavigate } = options;
  const wheelRef = useRef<{ total: number; lastAt: number; consumed: boolean; resetTimer: number | null }>({
    total: 0,
    lastAt: 0,
    consumed: false,
    resetTimer: null,
  });
  const touchRef = useRef<{
    startX: number;
    startY: number;
    lockedAxis: 'vertical' | 'horizontal' | null;
    samples: Array<{ y: number; t: number }>;
    triggered: boolean;
  } | null>(null);

  useEffect(() => {
    const element = feedRef.current;
    if (!element) return;

    const navigate = (direction: FeedDirection) => {
      if (touchRef.current) touchRef.current.triggered = true;
      return onNavigate(direction);
    };

    const onWheel = (event: WheelEvent) => {
      if (disabled) return;
      const absY = Math.abs(event.deltaY);
      const absX = Math.abs(event.deltaX);
      if (absY < 8 || absX > absY) return;

      event.preventDefault();
      const t = nowMs();
      const wheel = wheelRef.current;
      if (wheel.resetTimer) window.clearTimeout(wheel.resetTimer);
      wheel.resetTimer = window.setTimeout(() => {
        wheelRef.current = { total: 0, lastAt: 0, consumed: false, resetTimer: null };
      }, 160);

      if (t - wheel.lastAt > 160) {
        wheel.total = 0;
        wheel.consumed = false;
      }
      if (wheel.consumed) {
        wheel.lastAt = t;
        return;
      }

      wheel.total += event.deltaY;
      wheel.lastAt = t;

      if (Math.abs(wheel.total) >= 80) {
        if (navigate(wheel.total > 0 ? 'next' : 'prev')) {
          wheel.consumed = true;
          wheel.total = 0;
        }
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      touchRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        lockedAxis: null,
        samples: [{ y: touch.clientY, t: nowMs() }],
        triggered: false,
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (disabled || !touchRef.current || touchRef.current.triggered) return;
      const touch = event.touches[0];
      if (!touch) return;

      const state = touchRef.current;
      const dx = touch.clientX - state.startX;
      const dy = state.startY - touch.clientY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (!state.lockedAxis && Math.max(absX, absY) >= 12) {
        state.lockedAxis = absY > absX * 1.25 ? 'vertical' : 'horizontal';
      }

      if (state.lockedAxis !== 'vertical') return;
      event.preventDefault();

      const t = nowMs();
      state.samples = [...state.samples, { y: touch.clientY, t }].filter((sample) => t - sample.t <= 100);
      const firstSample = state.samples[0];
      const elapsed = Math.max(1, t - firstSample.t);
      const velocity = Math.abs(touch.clientY - firstSample.y) / elapsed;

      if (absY >= 56 || (velocity >= 0.45 && absY >= 32)) {
        navigate(dy > 0 ? 'next' : 'prev');
      }
    };

    const onTouchEnd = () => {
      touchRef.current = null;
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      if (wheelRef.current.resetTimer) window.clearTimeout(wheelRef.current.resetTimer);
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [disabled, feedRef, onNavigate]);
}

type LaunchpadAppProps = {
  initialContent: LaunchpadContent[];
  initialCategories: LaunchpadCategory[];
  initialContentSlug?: string | null;
};

export function LaunchpadApp({
  initialContent,
  initialCategories,
  initialContentSlug = null,
}: LaunchpadAppProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ContentFilters>({ category: null, format: null });
  const [query, setQuery] = useState('');
  const [feedIdx, setFeedIdx] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<LaunchpadContent | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [navDirection, setNavDirection] = useState<FeedDirection>('next');
  const [playingContentId, setPlayingContentId] = useState<string | null>(null);
  const [autoplayMode, setAutoplayMode] = useState<AutoplayMode>('audible');
  const toastTimer = useRef<number | null>(null);
  const navSurfaceRef = useRef<HTMLDivElement | null>(null);
  const feedDeckRef = useRef<HTMLDivElement | null>(null);
  const navLockedUntilRef = useRef(0);
  const activePlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();
  const previewContent = useMemo(
    () => initialContent.filter((content) => content.format !== 'playbook'),
    [initialContent]
  );
  const unfilteredFeedContent = useMemo(
    () => orderContentForFeed(previewContent, { category: null, format: null }),
    [previewContent]
  );

  const filteredContent = useMemo(() => {
    const base = applyContentFilters(previewContent, filters);
    const visible = query.trim()
      ? base.filter((item) => {
          const q = query.trim().toLowerCase();
          return [item.title, item.description, ...item.categories, item.format].join(' ').toLowerCase().includes(q);
        })
      : base;
    return orderContentForFeed(visible, filters);
  }, [filters, previewContent, query]);

  // Reset feedIdx when filters/query change — React-recommended "store info from
  // previous renders" pattern: detect the change during render and reset before paint.
  const filterKey = `${filters.category ?? ''}|${filters.format ?? ''}|${query}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setFeedIdx(0);
  }

  const safeIdx = filteredContent.length === 0 ? 0 : Math.min(feedIdx, filteredContent.length - 1);
  const item: LaunchpadContent | undefined = filteredContent[safeIdx];
  const nextItem = filteredContent[safeIdx + 1] ?? null;
  const effectivePlayingContentId = item?.id === playingContentId && isPlayableContent(item) ? playingContentId : null;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  // Initial load
  useEffect(() => {
    queueMicrotask(() => setSavedIds(readSavedIds()));
    trackEvent('entry_view', { metadata: { contentCount: previewContent.length } });
  }, [previewContent.length]);

  // Deep link
  useEffect(() => {
    const linked = getContentBySlug(previewContent, initialContentSlug ?? null);
    if (linked) {
      queueMicrotask(() => setSelected(linked));
      trackEvent('learn_more_open', { contentId: linked.id, metadata: { source: 'direct_link' } });
    } else if (initialContentSlug) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('content');
      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl);
      queueMicrotask(() => showToast('Content not available'));
    }
    const onPop = () => {
      const next = new URLSearchParams(window.location.search);
      setSelected(getContentBySlug(previewContent, next.get('content')) ?? null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [initialContentSlug, pathname, previewContent, router, searchParams, showToast]);

  const setCategory = useCallback((category: CategorySlug | null) => {
    setFilters((current) => ({ ...current, category }));
    trackEvent('category_filter', { metadata: { category: category ?? 'all' } });
  }, []);

  const setFormat = useCallback((format: ContentFormat | null) => {
    setFilters((current) => ({ ...current, format }));
    trackEvent('format_filter', { metadata: { format: format ?? 'all' } });
  }, []);

  const openPanel = useCallback((target: LaunchpadContent, source: string) => {
    activePlayerRef.current?.pauseVideo?.();
    setPlayingContentId(null);
    setSelected(target);
    const url = new URL(window.location.href);
    url.searchParams.set('content', target.slug);
    window.history.pushState({ contentSlug: target.slug }, '', url);
    trackEvent('content_open', { contentId: target.id, metadata: { source } });
    trackEvent('learn_more_open', { contentId: target.id, metadata: { source } });
  }, []);

  const closePanel = useCallback(() => {
    setSelected(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('content');
    window.history.replaceState({}, '', url);
  }, []);

  const jumpToSearchResult = useCallback(
    (target: LaunchpadContent) => {
      activePlayerRef.current?.pauseVideo?.();
      setPlayingContentId(null);
      setSearchOpen(false);
      setSelected(null);
      setFilters({ category: null, format: null });
      setQuery('');
      setPrevFilterKey('||');
      setNavDirection('next');
      setFeedIdx(Math.max(0, unfilteredFeedContent.findIndex((entry) => entry.id === target.id)));
      navLockedUntilRef.current = 0;

      const url = new URL(window.location.href);
      url.searchParams.delete('content');
      window.history.replaceState({}, '', url);
      trackEvent('content_open', { contentId: target.id, metadata: { source: 'search' } });
    },
    [unfilteredFeedContent]
  );

  const toggleSave = useCallback(
    (target: LaunchpadContent) => {
      setSavedIds((current) => {
        const wasSaved = current.includes(target.id);
        const next = wasSaved ? current.filter((id) => id !== target.id) : [...current, target.id];
        writeSavedIds(next);
        trackEvent('save', { contentId: target.id, metadata: { saved: !wasSaved } });
        showToast(wasSaved ? 'Removed from saves' : 'Saved · check back anytime');
        return next;
      });
    },
    [showToast]
  );

  const shareItem = useCallback(
    async (target: LaunchpadContent) => {
      const url = new URL(window.location.href);
      url.searchParams.set('content', target.slug);
      try {
        await window.navigator.clipboard.writeText(url.toString());
      } catch {
        window.prompt('Copy this link', url.toString());
      }
      trackEvent('share', { contentId: target.id });
      showToast('Link copied');
    },
    [showToast]
  );

  const navigateFeed = useCallback(
    (direction: FeedDirection, options: { ignoreLock?: boolean } = {}) => {
      const t = nowMs();
      if (!options.ignoreLock && t < navLockedUntilRef.current) return false;

      const delta = direction === 'next' ? 1 : -1;
      const nextIdx = Math.max(0, Math.min(filteredContent.length - 1, safeIdx + delta));
      if (nextIdx === safeIdx) return false;

      setNavDirection(direction);
      setFeedIdx(nextIdx);
      const nextItem = filteredContent[nextIdx];
      setPlayingContentId((current) => {
        if (!current || current !== item?.id) return null;
        return isPlayableContent(nextItem) ? nextItem.id : null;
      });
      navLockedUntilRef.current = t + FEED_NAV_LOCK_MS;
      return true;
    },
    [filteredContent, item, safeIdx]
  );

  const stepNext = useCallback(() => {
    navigateFeed('next');
  }, [navigateFeed]);
  const stepPrev = useCallback(() => {
    navigateFeed('prev');
  }, [navigateFeed]);

  useFeedNavigation(navSurfaceRef, {
    disabled: Boolean(selected || searchOpen),
    onNavigate: navigateFeed,
  });

  const playItem = useCallback((target: LaunchpadContent) => {
    if (!isPlayableContent(target)) return;
    setAutoplayMode('audible');
    setPlayingContentId(target.id);
  }, []);

  const stopPlayback = useCallback(() => {
    setPlayingContentId(null);
  }, []);

  const handleVideoEnd = useCallback(() => {
    if (item) {
      trackEvent('video_complete', { contentId: item.id });
    }
    const advanced = navigateFeed('next', { ignoreLock: true });
    if (!advanced) setPlayingContentId(null);
  }, [item, navigateFeed]);

  const handlePlayerReady = useCallback((player: YouTubePlayerInstance | null) => {
    activePlayerRef.current = player;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (selected || searchOpen) return;
      if (isInteractiveShortcutTarget(e.target) || isInteractiveShortcutTarget(document.activeElement)) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'j') {
        e.preventDefault();
        stepNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'k') {
        e.preventDefault();
        stepPrev();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        if (!item || !isPlayableContent(item)) return;
        e.preventDefault();
        if (effectivePlayingContentId === item.id) stopPlayback();
        else playItem(item);
      }
    };
    window.addEventListener('keydown', onKey as unknown as EventListener);
    return () => window.removeEventListener('keydown', onKey as unknown as EventListener);
  }, [effectivePlayingContentId, item, playItem, searchOpen, selected, stepNext, stepPrev, stopPlayback]);

  // Track impression when item changes
  const lastImpressionId = useRef<string | null>(null);
  useEffect(() => {
    if (!item || lastImpressionId.current === item.id) return;
    lastImpressionId.current = item.id;
    trackEvent('feed_impression', {
      contentId: item.id,
      metadata: { category: item.primaryCategory, categories: item.categories, format: item.format },
    });
  }, [item]);

  if (!item) {
    return (
      <EmptyState
        onClear={() => {
          setFilters({ category: null, format: null });
          setQuery('');
        }}
      />
    );
  }

  const isSaved = savedIds.includes(item.id);
  const stageProps = {
    item,
    nextItem,
    categories: initialCategories,
    isSaved,
    activeCategory: filters.category,
    activeFormat: filters.format,
    setCategory,
    setFormat,
    onLearnMore: () => openPanel(item, 'feed'),
    onSave: () => toggleSave(item),
    onShare: () => shareItem(item),
    onSearch: () => setSearchOpen(true),
    formatMenuOpen,
    setFormatMenuOpen,
    feedIdx: safeIdx,
    feedTotal: filteredContent.length,
    onNext: stepNext,
    onPrev: stepPrev,
    feedDeckRef,
    navDirection,
    reducedMotion,
    isPlaying: effectivePlayingContentId === item.id,
    autoplayMode,
    onPlay: () => playItem(item),
    onPause: stopPlayback,
    onVideoEnd: handleVideoEnd,
    onAutoplayModeChange: setAutoplayMode,
    onPlayerReady: handlePlayerReady,
    navSurfaceRef,
  };

  return (
    <main style={{ minHeight: '100vh', background: STAGE_BG, color: INK, fontFamily: 'var(--font-primary)' }}>
      {isMobile ? <MobileStage {...stageProps} /> : <DesktopStage {...stageProps} />}

      {selected && (
        <LearnMorePanel
          item={selected}
          categories={initialCategories}
          related={getRelatedContent(initialContent, selected)}
          isSaved={savedIds.includes(selected.id)}
          mobile={isMobile}
          onClose={closePanel}
          onSave={() => toggleSave(selected)}
          onShare={() => shareItem(selected)}
          onOutboundClick={(href) =>
            trackEvent('outbound_click', {
              contentId: selected.id,
              metadata: { href },
            })
          }
          onRelated={(next) => {
            trackEvent('related_content_click', {
              contentId: selected.id,
              metadata: { relatedContentId: next.id },
            });
            openPanel(next, 'related');
          }}
        />
      )}

      {searchOpen && (
        <SearchModal
          content={previewContent}
          categories={initialCategories}
          mobile={isMobile}
          onClose={() => setSearchOpen(false)}
          onPick={(picked) => {
            jumpToSearchResult(picked);
          }}
        />
      )}

      <Toast message={toast} show={!!toast} />
    </main>
  );
}

// ============================================================
// Desktop Stage
// ============================================================
type StageProps = {
  item: LaunchpadContent;
  nextItem: LaunchpadContent | null;
  categories: LaunchpadCategory[];
  isSaved: boolean;
  activeCategory: CategorySlug | null;
  activeFormat: ContentFormat | null;
  setCategory: (slug: CategorySlug | null) => void;
  setFormat: (format: ContentFormat | null) => void;
  onLearnMore: () => void;
  onSave: () => void;
  onShare: () => void;
  onSearch: () => void;
  formatMenuOpen: boolean;
  setFormatMenuOpen: (open: boolean) => void;
  feedIdx: number;
  feedTotal: number;
  onNext: () => void;
  onPrev: () => void;
  navSurfaceRef: RefObject<HTMLDivElement | null>;
  feedDeckRef: RefObject<HTMLDivElement | null>;
  navDirection: FeedDirection;
  reducedMotion: boolean;
  isPlaying: boolean;
  autoplayMode: AutoplayMode;
  onPlay: () => void;
  onPause: () => void;
  onVideoEnd: () => void;
  onAutoplayModeChange: (mode: AutoplayMode) => void;
  onPlayerReady: (player: YouTubePlayerInstance | null) => void;
};

function DesktopStage({
  item,
  nextItem,
  categories,
  isSaved,
  activeCategory,
  activeFormat,
  setCategory,
  setFormat,
  onLearnMore,
  onSave,
  onShare,
  onSearch,
  formatMenuOpen,
  setFormatMenuOpen,
  feedIdx,
  feedTotal,
  navSurfaceRef,
  feedDeckRef,
  navDirection,
  reducedMotion,
  isPlaying,
  autoplayMode,
  onPlay,
  onPause,
  onVideoEnd,
  onAutoplayModeChange,
  onPlayerReady,
}: StageProps) {
  const blockColor = CATEGORY_BLOCK_BG[item.primaryCategory] ?? BLUE;
  const DESKTOP_STAGE_MAX_WIDTH = 1720;

  return (
    <div
      ref={navSurfaceRef}
      data-testid="launchpad-navigation-surface"
      style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Header */}
      <header
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
          gap: 16,
          background: SURFACE,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: 0,
          }}
        >
          <BrandMark size={32} />
          Career LaunchPAD
        </div>
        <div style={{ flex: 1 }} />

        <FormatChooser
          active={activeFormat}
          open={formatMenuOpen}
          setOpen={setFormatMenuOpen}
          onPick={(value) => {
            setFormat(value);
            setFormatMenuOpen(false);
          }}
        />

        <button
          onClick={onSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 999,
            padding: '8px 14px',
            fontSize: 13,
            color: INK2,
            cursor: 'pointer',
            minWidth: 240,
          }}
          aria-label="Open search"
        >
          <Search size={14} />
          <span>Search careers, skills…</span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              padding: '2px 6px',
              border: `1px solid ${BORDER}`,
              borderRadius: 4,
            }}
          >
            ⌘K
          </span>
        </button>
      </header>

      {/* Filter rail — outer is purely a horizontal scroll wrapper; inner row centers via margin auto */}
      <div
        style={{
          padding: '14px 32px',
          borderBottom: `1px solid ${BORDER}`,
          overflowX: 'auto',
          flexShrink: 0,
          background: SURFACE,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            width: 'max-content',
            minWidth: 'max-content',
            margin: '0 auto',
          }}
        >
          <CategoryChip
            slug={null}
            label="For you"
            icon={Sparkles}
            active={activeCategory === null}
            onClick={() => setCategory(null)}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.slug}
              slug={c.slug}
              label={c.name}
              icon={CATEGORY_ICON[c.slug]}
              active={activeCategory === c.slug}
              onClick={() => setCategory(c.slug)}
            />
          ))}
        </div>
      </div>

      {/* Stage */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'clamp(20px, 2.5vw, 24px) clamp(24px, 4vw, 64px) clamp(28px, 4vw, 40px)',
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, min(42vw, 520px)) minmax(0, 1fr)',
            gap: 'clamp(24px, 3vw, 40px)',
            alignItems: 'center',
            width: '100%',
            maxWidth: DESKTOP_STAGE_MAX_WIDTH,
            height: '100%',
            minHeight: 0,
            boxSizing: 'border-box',
          }}
        >
        {/* LEFT: editorial */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ transform: 'rotate(-2deg)', display: 'inline-block' }}>
              <div
                data-testid="desktop-category-pill"
                style={{
                  background: blockColor,
                  color: '#fff',
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                }}
              >
                {categoryLabel(categories, item.primaryCategory)}
              </div>
            </div>
            <FormatPill type={item.format} />
          </div>

          <h1
            style={{
              fontSize: 'clamp(40px, 4vw, 56px)',
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              margin: 0,
              textWrap: 'balance' as CSSProperties['textWrap'],
            }}
          >
            <HighlightedTitle title={item.title} accent={BLUE} />
          </h1>

          <p
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              color: INK2,
              margin: 0,
              textWrap: 'pretty' as CSSProperties['textWrap'],
            }}
          >
            {item.description}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 12,
              fontWeight: 700,
              color: INK2,
              flexWrap: 'wrap',
            }}
          >
            {item.format === 'video' && item.durationSeconds && (
              <Meta icon={Clock} label={formatDuration(item.durationSeconds) ?? ''} />
            )}
            {item.format === 'article' && <Meta icon={BookOpen} label="Article" />}
            {item.format === 'article' && item.readingTimeMinutes && (
              <Meta icon={Clock} label={`${item.readingTimeMinutes} min read`} />
            )}
            <Meta
              icon={Eye}
              label={`Item ${feedIdx + 1} / ${feedTotal}`}
            />
          </div>

          <div
            style={{
              borderLeft: `3px solid ${BLUE}`,
              paddingLeft: 16,
              fontSize: 15,
              lineHeight: 1.5,
              color: INK,
              fontStyle: 'italic',
              fontWeight: 500,
            }}
          >
            {pullQuoteFor(item)}
          </div>

          <LearnMoreCta format={item.format} variant="desktop" onClick={onLearnMore} />

        </div>

        {/* CENTER: media */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            height: '100%',
          }}
        >
          <FeedMediaDeck
            deckRef={feedDeckRef}
            item={item}
            nextItem={nextItem}
            blockColor={blockColor}
            variant="desktop-immersive"
            direction={navDirection}
            reducedMotion={reducedMotion}
            isPlaying={isPlaying}
            isSaved={isSaved}
            autoplayMode={autoplayMode}
            onPlay={onPlay}
            onPause={onPause}
            onVideoEnd={onVideoEnd}
            onSave={onSave}
            onShare={onShare}
            onLearnMore={onLearnMore}
            onAutoplayModeChange={onAutoplayModeChange}
            onPlayerReady={onPlayerReady}
          />
        </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Mobile Stage — full-bleed media + overlaid CTA
// ============================================================
function MobileStage({
  item,
  categories,
  isSaved,
  activeCategory,
  setCategory,
  onLearnMore,
  onSave,
  onShare,
  onSearch,
  navSurfaceRef,
  feedDeckRef,
  navDirection,
  reducedMotion,
  isPlaying,
  autoplayMode,
  onPlay,
  onPause,
  onVideoEnd,
  onAutoplayModeChange,
  onPlayerReady,
}: StageProps) {
  return (
    <div
      ref={navSurfaceRef}
      data-testid="launchpad-navigation-surface"
      style={{
        width: '100%',
        height: '100vh',
        background: STAGE_BG,
        color: INK,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: `1px solid ${BORDER}`,
          gap: 10,
          flexShrink: 0,
          background: SURFACE,
        }}
      >
        <BrandMark size={28} />
        <div style={{ fontWeight: 900, fontSize: 15 }}>Career LaunchPAD</div>
        <div style={{ flex: 1 }} />
        <button
          onClick={onSearch}
          style={{ background: 'transparent', border: 'none', color: INK, padding: 8, cursor: 'pointer' }}
          aria-label="Open search"
        >
          <Search size={20} />
        </button>
      </div>

      {/* category strip */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          flexShrink: 0,
          background: SURFACE,
        }}
      >
        <CategoryChip
          slug={null}
          label="For you"
          icon={Sparkles}
          active={activeCategory === null}
          onClick={() => setCategory(null)}
          compact
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.slug}
            slug={c.slug}
            label={categoryShortLabel(c)}
            icon={CATEGORY_ICON[c.slug]}
            active={activeCategory === c.slug}
            onClick={() => setCategory(c.slug)}
            compact
          />
        ))}
      </div>

      {/* Stage: video fills full space */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        <FeedMediaDeck
          deckRef={feedDeckRef}
          item={item}
          nextItem={null}
          blockColor={CATEGORY_BLOCK_BG[item.primaryCategory]}
          variant="mobile"
          direction={navDirection}
          reducedMotion={reducedMotion}
          isPlaying={isPlaying}
          isSaved={isSaved}
          autoplayMode={autoplayMode}
          onPlay={onPlay}
          onPause={onPause}
          onVideoEnd={onVideoEnd}
          onSave={onSave}
          onShare={onShare}
          onLearnMore={onLearnMore}
          onAutoplayModeChange={onAutoplayModeChange}
          onPlayerReady={onPlayerReady}
        />

        {/* floating action rail */}
        <div
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            zIndex: 6,
          }}
        >
          <MobileRailBtn
            icon={Heart}
            label="Save"
            active={isSaved}
            onClick={onSave}
          />
          <MobileRailBtn icon={Share2} label="Share" onClick={onShare} />
          <MobileRailBtn icon={Info} label="Info" onClick={onLearnMore} />

          <div
            style={{
              marginTop: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              color: '#fff',
              opacity: 0.85,
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ChevronsDown size={18} />
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}
            >
              Scroll
            </span>
          </div>
        </div>

        <LearnMoreCta format={item.format} variant="mobile" onClick={onLearnMore} />
      </div>
    </div>
  );
}

// ============================================================
// Media Stage (video / article / playbook poster)
// ============================================================
type MediaDeckCard = {
  item: LaunchpadContent;
  blockColor: string;
};

function FeedMediaDeck({
  deckRef,
  item,
  nextItem,
  blockColor,
  variant,
  direction,
  reducedMotion,
  isPlaying,
  isSaved,
  autoplayMode,
  onPlay,
  onPause,
  onVideoEnd,
  onSave,
  onShare,
  onLearnMore,
  onAutoplayModeChange,
  onPlayerReady,
}: {
  deckRef: RefObject<HTMLDivElement | null>;
  item: LaunchpadContent;
  nextItem: LaunchpadContent | null;
  blockColor: string;
  variant: FeedMediaVariant;
  direction: FeedDirection;
  reducedMotion: boolean;
  isPlaying: boolean;
  isSaved: boolean;
  autoplayMode: AutoplayMode;
  onPlay: () => void;
  onPause: () => void;
  onVideoEnd: () => void;
  onSave: () => void;
  onShare: () => void;
  onLearnMore: () => void;
  onAutoplayModeChange: (mode: AutoplayMode) => void;
  onPlayerReady: (player: YouTubePlayerInstance | null) => void;
}) {
  const [current, setCurrent] = useState<MediaDeckCard>({ item, blockColor });
  const [previous, setPrevious] = useState<MediaDeckCard | null>(null);
  const [transitionDirection, setTransitionDirection] = useState<FeedDirection>(direction);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'prepare' | 'animating'>('idle');
  const [nudging, setNudging] = useState(false);
  const incomingKey = `${item.id}|${blockColor}|${reducedMotion ? 'reduced' : 'motion'}`;
  const [renderedKey, setRenderedKey] = useState(incomingKey);

  if (renderedKey !== incomingKey) {
    setRenderedKey(incomingKey);
    if (current.item.id === item.id || reducedMotion) {
      setPrevious(null);
      setTransitionPhase('idle');
      setTransitionDirection(direction);
      setCurrent({ item, blockColor });
    } else {
      setPrevious(current);
      setTransitionDirection(direction);
      setTransitionPhase('prepare');
      setCurrent({ item, blockColor });
    }
  }

  useEffect(() => {
    if (transitionPhase !== 'prepare') return;

    const phaseTimer = window.setTimeout(() => setTransitionPhase('animating'), 16);
    const doneTimer = window.setTimeout(() => {
      setPrevious(null);
      setTransitionPhase('idle');
    }, FEED_TRANSITION_MS);

    return () => {
      window.clearTimeout(phaseTimer);
      window.clearTimeout(doneTimer);
    };
  }, [current.item.id, transitionPhase]);

  useEffect(() => {
    if (reducedMotion) return;
    if (window.sessionStorage.getItem(FEED_NUDGE_KEY) === 'true') return;

    let stopTimer: number | null = null;
    const startTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(FEED_NUDGE_KEY, 'true');
      setNudging(true);
      stopTimer = window.setTimeout(() => setNudging(false), 520);
    }, 420);

    return () => {
      window.clearTimeout(startTimer);
      if (stopTimer) window.clearTimeout(stopTimer);
    };
  }, [reducedMotion]);

  const transitioning = transitionPhase !== 'idle';
  const isMobileVariant = variant === 'mobile';
  const deckStyle: CSSProperties = isMobileVariant
    ? {
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 1,
        touchAction: 'none',
        transform: nudging ? 'translate3d(0, -18px, 0)' : 'translate3d(0, 0, 0)',
        transition: nudging ? 'transform 520ms var(--ease-out)' : undefined,
      }
    : {
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        borderRadius: 18,
        overflow: 'hidden',
        zIndex: 1,
        touchAction: 'none',
        transform: nudging ? 'translate3d(0, -18px, 0)' : 'translate3d(0, 0, 0)',
        transition: nudging ? 'transform 520ms var(--ease-out)' : undefined,
      };

  const cardStyle = (role: 'current' | 'previous'): CSSProperties => {
    const baseStyle: CSSProperties = isMobileVariant
      ? { position: 'absolute', inset: 0 }
      : { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' };

    if (!transitioning || reducedMotion) {
      return { ...baseStyle, transform: 'translate3d(0, 0, 0)', opacity: 1 };
    }

    const enteringFrom = transitionDirection === 'next' ? '100%' : '-100%';
    const exitingTo = transitionDirection === 'next' ? '-100%' : '100%';
    const isPreparing = transitionPhase === 'prepare';

    return {
      ...baseStyle,
      transform:
        role === 'current'
          ? `translate3d(0, ${isPreparing ? enteringFrom : '0'}, 0)`
          : `translate3d(0, ${isPreparing ? '0' : exitingTo}, 0)`,
      opacity: role === 'current' ? 1 : isPreparing ? 1 : 0.35,
      transition: isPreparing
        ? 'none'
        : `transform ${FEED_TRANSITION_MS}ms var(--ease-out), opacity ${FEED_TRANSITION_MS}ms var(--ease-out)`,
      pointerEvents: role === 'current' ? 'auto' : 'none',
      zIndex: role === 'current' ? 2 : 1,
    };
  };

  return (
    <div
      ref={deckRef}
      data-testid="feed-media-deck"
      data-transitioning={transitioning ? 'true' : 'false'}
      data-nudging={nudging ? 'true' : 'false'}
      style={deckStyle}
    >
      {previous && (
        <div data-testid={`feed-media-card-${previous.item.id}`} style={cardStyle('previous')}>
          {!isMobileVariant && <ImmersiveBackdrop item={previous.item} />}
          <MediaStage
            item={previous.item}
            nextItem={null}
            variant={variant}
            isPlaying={false}
            autoplayMode={autoplayMode}
            onPlay={onPlay}
            onPause={onPause}
            onVideoEnd={onVideoEnd}
            onAutoplayModeChange={onAutoplayModeChange}
            onPlayerReady={onPlayerReady}
          />
        </div>
      )}
      <div data-testid={`feed-media-card-${current.item.id}`} style={cardStyle('current')}>
        {!isMobileVariant && <ImmersiveBackdrop item={current.item} />}
        <MediaStage
          item={current.item}
          nextItem={nextItem}
          variant={variant}
          isPlaying={isPlaying}
          autoplayMode={autoplayMode}
          onPlay={onPlay}
          onPause={onPause}
          onVideoEnd={onVideoEnd}
          onAutoplayModeChange={onAutoplayModeChange}
          onPlayerReady={onPlayerReady}
        />
      </div>
      {!isMobileVariant && (
        <DesktopOverlayRail
          isSaved={isSaved}
          onSave={onSave}
          onShare={onShare}
          onLearnMore={onLearnMore}
        />
      )}
    </div>
  );
}

function ImmersiveBackdrop({ item }: { item: LaunchpadContent }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        data-testid="desktop-immersive-backdrop"
        src={item.thumbnailUrl}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.08)',
          filter: 'blur(18px)',
          opacity: 0.82,
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(8,8,26,0.74) 0%, rgba(8,8,26,0.48) 38%, rgba(8,8,26,0.72) 100%)',
          zIndex: 1,
        }}
      />
    </>
  );
}

function DesktopOverlayRail({
  isSaved,
  onSave,
  onShare,
  onLearnMore,
}: {
  isSaved: boolean;
  onSave: () => void;
  onShare: () => void;
  onLearnMore?: () => void;
}) {
  return (
    <div
      data-testid="desktop-overlay-rail"
      style={{
        position: 'absolute',
        right: 'clamp(16px, 2vw, 28px)',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'center',
        zIndex: 6,
      }}
    >
      <DesktopRailBtn
        icon={Heart}
        label={isSaved ? 'Saved' : 'Save'}
        active={isSaved}
        onClick={onSave}
      />
      <DesktopRailBtn icon={Share2} label="Share" onClick={onShare} />
      {onLearnMore && <DesktopRailBtn icon={Info} label="Info" onClick={onLearnMore} />}
      <div
        data-testid="desktop-scroll-hint"
        style={{
          marginTop: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          color: '#fff',
          textShadow: '0 1px 5px rgba(0,0,0,0.75)',
        }}
      >
        <ChevronsDown size={18} />
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          Scroll
          <br />
          for more
        </span>
      </div>
    </div>
  );
}

function YouTubePlayer({
  videoId,
  title,
  autoplayMode,
  onAutoplayModeChange,
  onVideoEnd,
  onPlayerReady,
}: {
  videoId: string;
  title: string;
  autoplayMode: AutoplayMode;
  onAutoplayModeChange: (mode: AutoplayMode) => void;
  onVideoEnd: () => void;
  onPlayerReady: (player: YouTubePlayerInstance | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const playedRef = useRef(false);
  const endedRef = useRef(false);
  const fallbackTimerRef = useRef<number | null>(null);
  const initialAutoplayModeRef = useRef(autoplayMode);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let hostElement: HTMLDivElement | null = null;

    const clearFallbackTimer = () => {
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };

    const fallbackToMuted = () => {
      const player = playerRef.current;
      if (!player) return;
      player.mute();
      onAutoplayModeChange('muted-fallback');
      player.playVideo();
    };

    const createPlayer = (YT: YouTubeNamespace) => {
      const host = hostRef.current;
      if (cancelled || !host) return;
      hostElement = host;
      host.textContent = '';
      const playerMount = document.createElement('div');
      Object.assign(playerMount.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
      });
      host.appendChild(playerMount);

      const player = new YT.Player(playerMount, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            const policy = window.navigator.getAutoplayPolicy?.('mediaelement');
            const shouldStartMuted = initialAutoplayModeRef.current === 'muted-fallback' || policy === 'allowed-muted';
            if (shouldStartMuted) {
              player.mute();
              onAutoplayModeChange('muted-fallback');
            } else {
              player.unMute?.();
            }
            player.playVideo();
            fallbackTimerRef.current = window.setTimeout(() => {
              if (!playedRef.current) fallbackToMuted();
            }, 900);
            const iframe = hostRef.current?.querySelector('iframe');
            iframe?.setAttribute('tabindex', '-1');
            iframe?.setAttribute('title', title);
            if (iframe) {
              Object.assign(iframe.style, {
                position: 'absolute',
                inset: '0',
                width: '100%',
                height: '100%',
                border: '0px',
                display: 'block',
              });
            }
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              playedRef.current = true;
              setHasPlayed(true);
              clearFallbackTimer();
            } else if (event.data === YT.PlayerState.ENDED && !endedRef.current) {
              endedRef.current = true;
              clearFallbackTimer();
              onVideoEnd();
            }
          },
          onAutoplayBlocked: fallbackToMuted,
        },
      });

      playerRef.current = player;
      onPlayerReady(player);
    };

    if (window.YT?.Player) createPlayer(window.YT);
    else loadYouTubeIframeAPI().then(createPlayer);

    return () => {
      cancelled = true;
      clearFallbackTimer();
      playerRef.current?.destroy();
      playerRef.current = null;
      onPlayerReady(null);
      if (hostElement) hostElement.textContent = '';
    };
  }, [onAutoplayModeChange, onPlayerReady, onVideoEnd, title, videoId]);

  return (
    <div
      ref={hostRef}
      data-testid={`youtube-host-${videoId}`}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        opacity: hasPlayed ? 1 : 0,
        overflow: 'hidden',
        transition: 'opacity 160ms var(--ease-standard)',
        pointerEvents: 'none',
      }}
    />
  );
}

function MediaStage({
  item,
  nextItem,
  variant,
  isPlaying,
  autoplayMode,
  onPlay,
  onPause,
  onAutoplayModeChange,
  onPlayerReady,
  onVideoEnd,
}: {
  item: LaunchpadContent;
  nextItem: LaunchpadContent | null;
  variant: FeedMediaVariant;
  isPlaying: boolean;
  autoplayMode: AutoplayMode;
  onPlay: () => void;
  onPause: () => void;
  onAutoplayModeChange: (mode: AutoplayMode) => void;
  onPlayerReady: (player: YouTubePlayerInstance | null) => void;
  onVideoEnd: () => void;
}) {
  const progressTracked = useRef(new Set<number>());
  const videoId = getYouTubeId(item.mediaUrl);
  const isPlayableVideo = item.format === 'video' && Boolean(videoId);
  const isMobileVariant = variant === 'mobile';

  // Video progress milestones
  useEffect(() => {
    if (!isPlaying || item.format !== 'video') return;
    trackEvent('video_play', { contentId: item.id });
    let elapsed = 0;
    const duration = item.durationSeconds ?? 90;
    const timer = window.setInterval(() => {
      elapsed += 5;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      [25, 50, 80].forEach((milestone) => {
        if (progress >= milestone && !progressTracked.current.has(milestone)) {
          progressTracked.current.add(milestone);
          trackEvent('video_progress', { contentId: item.id, metadata: { milestone } });
        }
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [item, isPlaying]);

  if (isMobileVariant) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnailUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 55%, rgba(0,0,0,0.7) 100%)',
          }}
        />
        <FormatBadge type={item.format} top={12} left={14} />
        {isPlayableVideo && !isPlaying && (
          <button
            onClick={onPlay}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              zIndex: 3,
            }}
            aria-label={`Play ${item.title}`}
          >
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 999,
                background: BLUE,
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 10px 30px rgba(0,146,255,0.55)',
              }}
            >
              <Play size={32} style={{ color: '#fff', marginLeft: 3 }} />
            </div>
          </button>
        )}
        {isPlayableVideo && isPlaying && videoId && (
          <>
            <YouTubePlayer
              videoId={videoId}
              title={item.title}
              autoplayMode={autoplayMode}
              onAutoplayModeChange={onAutoplayModeChange}
              onPlayerReady={onPlayerReady}
              onVideoEnd={onVideoEnd}
            />
            <div
              data-testid="youtube-scroll-overlay"
              aria-hidden="true"
              onClick={onPause}
              style={{ position: 'absolute', inset: 0, zIndex: 4, cursor: 'pointer' }}
            />
          </>
        )}
        {item.format === 'article' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '20px 20px calc(136px + env(safe-area-inset-bottom))',
              display: 'flex',
              alignItems: 'flex-end',
              color: '#fff',
            }}
          >
            <div
              data-testid="media-article-copy"
              style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.01em' }}
            >
              {item.title}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop 9:16 stage
  return (
    <div
      data-testid="desktop-immersive-media-frame"
      style={{
        position: 'relative',
        aspectRatio: '9 / 16',
        height: 'min(calc(100dvh - 214px), 1040px)',
        maxHeight: 'calc(100% - 56px)',
        maxWidth: 'calc(100% - 132px)',
        width: 'auto',
        margin: '0 auto',
        overflow: 'visible',
        transform: 'translateY(-14px)',
        zIndex: 2,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: '#000',
          zIndex: 1,
          borderRadius: 16,
          boxShadow: '0 30px 60px rgba(34,34,76,0.18)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnailUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 30%, transparent 65%, rgba(0,0,0,0.6) 100%)',
          }}
        />
        {isPlayableVideo && !isPlaying && (
          <button
            onClick={onPlay}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              zIndex: 3,
            }}
            aria-label={`Play ${item.title}`}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 999,
                background: BLUE,
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 10px 30px rgba(0,146,255,0.6)',
              }}
            >
              <Play size={32} style={{ color: '#fff', marginLeft: 4 }} />
            </div>
          </button>
        )}
        {isPlayableVideo && isPlaying && videoId && (
          <>
            <YouTubePlayer
              videoId={videoId}
              title={item.title}
              autoplayMode={autoplayMode}
              onAutoplayModeChange={onAutoplayModeChange}
              onPlayerReady={onPlayerReady}
              onVideoEnd={onVideoEnd}
            />
            <div
              data-testid="youtube-scroll-overlay"
              aria-hidden="true"
              onClick={onPause}
              style={{ position: 'absolute', inset: 0, zIndex: 4, cursor: 'pointer' }}
            />
          </>
        )}
        {item.format === 'video' && !isPlaying && item.durationSeconds && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              right: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              zIndex: 3,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 3,
                background: 'rgba(255,255,255,0.25)',
                borderRadius: 999,
              }}
            />
            <span
              style={{
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              0:00 / {formatDuration(item.durationSeconds)}
            </span>
          </div>
        )}
        {item.format === 'article' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '32px 20px 104px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              color: '#fff',
            }}
          >
            <div data-testid="media-article-copy">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  opacity: 0.85,
                  marginBottom: 10,
                }}
              >
                The read
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                {item.title}
              </div>
            </div>
          </div>
        )}
      </div>
      {nextItem && (
        <div
          data-testid="desktop-next-card-peek"
          data-next-slug={nextItem.slug}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 'calc(100% + 24px)',
            left: '50%',
            width: '90%',
            aspectRatio: '9 / 16',
            transform: 'translateX(-50%)',
            overflow: 'hidden',
            borderRadius: 14,
            background: '#000',
            opacity: 0.82,
            zIndex: 0,
            boxShadow: '0 22px 42px rgba(8,8,26,0.26)',
            pointerEvents: 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={nextItem.thumbnailUrl}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'saturate(0.9)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(8,8,26,0.48))',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Highlighted title — wrap longest >4-letter word in accent block
// ============================================================
function HighlightedTitle({ title, accent }: { title: string; accent: string }) {
  const { words, bestIdx } = useMemo(() => {
    const ws = title.split(' ');
    let idx = 0;
    let best = 0;
    ws.forEach((w, i) => {
      const clean = w.replace(/[^a-zA-Z]/g, '');
      if (clean.length > best && clean.length > 4) {
        best = clean.length;
        idx = i;
      }
    });
    return { words: ws, bestIdx: idx };
  }, [title]);

  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          {i === bestIdx ? (
            <span
              style={{
                display: 'inline-block',
                background: accent,
                color: '#fff',
                padding: '0.02em 0.14em 0.08em',
                lineHeight: 0.92,
                verticalAlign: 'baseline',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
              }}
            >
              {w}
            </span>
          ) : (
            w
          )}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}

// ============================================================
// Smaller building blocks
// ============================================================
function FormatBadge({ type, top, left }: { type: ContentFormat; top: number; left: number }) {
  const Cmp = FORMAT_ICON[type];
  return (
    <div data-testid="media-format-badge" style={{ position: 'absolute', top, left, zIndex: 3 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255,255,255,0.14)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.22)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 999,
          letterSpacing: '0.02em',
        }}
      >
        <Cmp size={13} />
        {FORMAT_LABEL[type]}
      </span>
    </div>
  );
}

function FormatPill({ type }: { type: ContentFormat }) {
  const Cmp = FORMAT_ICON[type];
  return (
    <div
      data-testid="desktop-format-pill"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        border: `1px solid ${BORDER}`,
        background: SURFACE,
        color: INK,
        padding: '6px 12px',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        borderRadius: 999,
        boxShadow: '0 4px 14px rgba(34,34,76,0.06)',
      }}
    >
      <Cmp size={13} />
      {FORMAT_LABEL[type]}
    </div>
  );
}

function CategoryChip({
  slug,
  label,
  icon: IconCmp,
  active,
  onClick,
  compact = false,
}: {
  slug: CategorySlug | null;
  label: string;
  icon: IconCmp;
  active: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      data-slug={slug ?? 'all'}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: compact ? '8px 12px' : '10px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: '1px solid',
        transition: 'all 160ms var(--ease-standard)',
        whiteSpace: 'nowrap',
        background: active ? NAVY : SURFACE,
        color: active ? '#fff' : NAVY,
        borderColor: active ? NAVY : '#D9DFEA',
      }}
    >
      <IconCmp size={14} />
      {label}
    </button>
  );
}

function DesktopRailBtn({
  icon: IconCmp,
  label,
  active,
  onClick,
}: {
  icon: IconCmp;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="lp-overlay-rail-button"
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: 0,
        color: '#fff',
        textShadow: '0 1px 5px rgba(0,0,0,0.75)',
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: active ? BLUE : 'rgba(8,8,26,0.62)',
          border: `1px solid ${active ? BLUE : 'rgba(255,255,255,0.22)'}`,
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          transition: 'background 160ms var(--ease-standard), border-color 160ms var(--ease-standard)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.24)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <IconCmp size={21} fill={active ? 'currentColor' : 'none'} />
      </span>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.01em' }}>{label}</span>
    </button>
  );
}

function MobileRailBtn({
  icon: IconCmp,
  label,
  active,
  onClick,
}: {
  icon: IconCmp;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          background: active ? BLUE : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'grid',
          placeItems: 'center',
          color: active ? '#fff' : NAVY,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <IconCmp size={16} fill={active ? 'currentColor' : 'none'} />
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: '#fff',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </button>
  );
}

function Meta({ icon: IconCmp, label }: { icon: IconCmp; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <IconCmp size={13} />
      {label}
    </span>
  );
}

// ============================================================
// Format chooser (small button + popover)
// ============================================================
function FormatChooser({
  active,
  open,
  setOpen,
  onPick,
}: {
  active: ContentFormat | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  onPick: (format: ContentFormat | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: globalThis.MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDocClick);
    return () => window.removeEventListener('mousedown', onDocClick);
  }, [open, setOpen]);

  const activeFormat = formats.find((f) => f.value === active);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Filter by format"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: SURFACE,
          border: `1px solid ${active ? BLUE : BORDER}`,
          borderRadius: 999,
          padding: '8px 12px',
          fontSize: 13,
          fontWeight: 600,
          color: active ? BLUE : INK2,
          cursor: 'pointer',
        }}
      >
        <ListFilter size={14} />
        {activeFormat ? activeFormat.label : 'All formats'}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(34,34,76,0.16)',
            padding: 6,
            minWidth: 180,
            zIndex: 50,
          }}
        >
          <FormatOption label="All formats" active={active === null} onClick={() => onPick(null)} icon={LayoutList} />
          {formats.map((f) => (
            <FormatOption
              key={f.value}
              label={f.label}
              active={active === f.value}
              onClick={() => onPick(f.value)}
              icon={FORMAT_ICON[f.value]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FormatOption({
  label,
  active,
  onClick,
  icon: IconCmp,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: IconCmp;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        background: active ? '#E6F4FF' : 'transparent',
        color: active ? BLUE : INK,
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        textAlign: 'left',
      }}
    >
      <IconCmp size={14} />
      {label}
    </button>
  );
}

// ============================================================
// Spotlight Search Modal
// ============================================================
function SearchModal({
  content,
  categories,
  mobile,
  onClose,
  onPick,
}: {
  content: LaunchpadContent[];
  categories: LaunchpadCategory[];
  mobile: boolean;
  onClose: () => void;
  onPick: (item: LaunchpadContent) => void;
}) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey as unknown as EventListener);
    return () => window.removeEventListener('keydown', onKey as unknown as EventListener);
  }, [onClose]);

  const results = useMemo(() => {
    if (!q.trim()) return orderContentForFeed(content, { category: null, format: null }).slice(0, 6);
    const needle = q.trim().toLowerCase();
    return content.filter((entry) =>
      [entry.title, entry.description, ...entry.categories, entry.format]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [content, q]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,8,26,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: mobile ? '6vh' : '12vh',
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: mobile ? '92%' : 'min(680px, 92%)',
          height: 'fit-content',
          background: SURFACE,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
          border: `1px solid ${BORDER}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '18px 20px',
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <Search size={20} style={{ color: INK2 }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search careers, skills, articles…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 18,
              color: INK,
              fontFamily: 'inherit',
              fontWeight: 500,
            }}
          />
          <span
            style={{
              fontSize: 11,
              padding: '4px 8px',
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              color: INK2,
              fontWeight: 700,
            }}
          >
            ESC
          </span>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: INK2 }}>
              No matches yet — try &ldquo;internship&rdquo; or &ldquo;feedback&rdquo;
            </div>
          ) : (
            results.map((entry) => (
              <button
                key={entry.id}
                data-testid="search-result"
                data-format={entry.format}
                onClick={() => onPick(entry)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  padding: '14px 20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: INK,
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  borderBottom: `1px solid ${BORDER}`,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 60,
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: '#000',
                    flexShrink: 0,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.thumbnailUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{entry.title}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: INK2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>{entry.format}</span> · <span>{categoryLabel(categories, entry.primaryCategory)}</span>
                  </div>
                </div>
                <ArrowUpRight size={16} style={{ color: INK2 }} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Toast
// ============================================================
function Toast({ message, show }: { message: string | null; show: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: `translateX(-50%) translateY(${show ? 0 : 20}px)`,
        opacity: show ? 1 : 0,
        background: NAVY,
        color: 'white',
        padding: '12px 20px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: 'var(--shadow-lg)',
        pointerEvents: 'none',
        transition: 'opacity 200ms, transform 200ms',
        zIndex: 9999,
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  );
}

// ============================================================
// Empty state — when filter+search produces no items
// ============================================================
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 32,
        background: STAGE_BG,
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: 380,
          background: SURFACE,
          padding: 40,
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <Sparkles size={32} style={{ color: BLUE }} />
        <h2 style={{ margin: '12px 0 8px', fontSize: 22, fontWeight: 900 }}>No matches yet</h2>
        <p style={{ color: INK2, margin: '0 0 20px', fontSize: 14 }}>
          Clear a filter or try a broader search to keep exploring.
        </p>
        <button
          onClick={onClear}
          style={{
            background: BLUE,
            color: '#fff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Clear filters
        </button>
      </div>
    </main>
  );
}

// ============================================================
// Helpers
// ============================================================
function pullQuoteFor(item: LaunchpadContent): string {
  return item.learnMore.takeaway ?? item.description;
}

// Suppress unused import warning on Clipboard — kept available for future share UI.
void Clipboard;
