'use client';

import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Brain,
  Briefcase,
  ChevronsDown,
  Clipboard,
  ClipboardList,
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

import { categories, formats, launchpadContent } from '@/data/content';
import {
  applyContentFilters,
  formatDuration,
  getContentBySlug,
  getRelatedContent,
  getYouTubeId,
} from '@/lib/content';
import { trackEvent } from '@/lib/analytics';
import type { CategorySlug, ContentFilters, ContentFormat, LaunchpadContent } from '@/types';

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

type AutoplayMode = 'audible' | 'muted-fallback';
type FeedDirection = 'next' | 'prev';
type FeedMediaVariant = 'mobile' | 'desktop-immersive';

type IconCmp = ComponentType<{ size?: number; className?: string; strokeWidth?: number; style?: CSSProperties }>;

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
  'job-board': ClipboardList,
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

function fmtViews(n: number | undefined): string {
  if (!n) return '0';
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1) + 'K';
  if (n < 1000000) return Math.round(n / 1000) + 'K';
  return (n / 1000000).toFixed(1) + 'M';
}

function categoryLabel(slug: CategorySlug): string {
  return categories.find((c) => c.slug === slug)?.label ?? slug;
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

export function LaunchpadApp() {
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
  const feedDeckRef = useRef<HTMLDivElement | null>(null);
  const navLockedUntilRef = useRef(0);
  const activePlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();

  const filteredContent = useMemo(() => {
    const base = applyContentFilters(launchpadContent, filters);
    if (!query.trim()) return base;
    const q = query.trim().toLowerCase();
    return base.filter((item) =>
      [item.title, item.description, item.category, item.format].join(' ').toLowerCase().includes(q)
    );
  }, [filters, query]);

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
  const effectivePlayingContentId = item?.id === playingContentId && isPlayableContent(item) ? playingContentId : null;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  // Initial load
  useEffect(() => {
    queueMicrotask(() => setSavedIds(readSavedIds()));
    trackEvent('entry_view', { metadata: { contentCount: launchpadContent.length } });
  }, []);

  // Deep link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contentSlug = params.get('content');
    const linked = getContentBySlug(launchpadContent, contentSlug);
    if (linked) {
      queueMicrotask(() => setSelected(linked));
      trackEvent('learn_more_open', { contentId: linked.id, metadata: { source: 'direct_link' } });
    } else if (contentSlug) {
      const url = new URL(window.location.href);
      url.searchParams.delete('content');
      window.history.replaceState({}, '', url);
      queueMicrotask(() => showToast('That content is not available anymore'));
    }
    const onPop = () => {
      const next = new URLSearchParams(window.location.search);
      setSelected(getContentBySlug(launchpadContent, next.get('content')) ?? null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [showToast]);

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
    (direction: FeedDirection) => {
      const t = nowMs();
      if (t < navLockedUntilRef.current) return false;

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

  useFeedNavigation(feedDeckRef, {
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
      metadata: { category: item.category, format: item.format },
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
    onAutoplayModeChange: setAutoplayMode,
    onPlayerReady: handlePlayerReady,
  };

  return (
    <main style={{ minHeight: '100vh', background: STAGE_BG, color: INK, fontFamily: 'var(--font-primary)' }}>
      {isMobile ? <MobileStage {...stageProps} /> : <DesktopStage {...stageProps} />}

      {selected && (
        <LearnMorePanel
          item={selected}
          related={getRelatedContent(launchpadContent, selected)}
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
          mobile={isMobile}
          onClose={() => setSearchOpen(false)}
          onPick={(picked) => {
            setSearchOpen(false);
            openPanel(picked, 'search');
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
  feedDeckRef: RefObject<HTMLDivElement | null>;
  navDirection: FeedDirection;
  reducedMotion: boolean;
  isPlaying: boolean;
  autoplayMode: AutoplayMode;
  onPlay: () => void;
  onPause: () => void;
  onAutoplayModeChange: (mode: AutoplayMode) => void;
  onPlayerReady: (player: YouTubePlayerInstance | null) => void;
};

function DesktopStage({
  item,
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
  feedDeckRef,
  navDirection,
  reducedMotion,
  isPlaying,
  autoplayMode,
  onPlay,
  onPause,
  onAutoplayModeChange,
  onPlayerReady,
}: StageProps) {
  const blockColor = CATEGORY_BLOCK_BG[item.category] ?? BLUE;
  const DESKTOP_STAGE_MAX_WIDTH = 1720;

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            letterSpacing: '-0.01em',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: BLUE,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontWeight: 900,
            }}
            aria-hidden
          >
            m
          </div>
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
              label={c.label}
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
                {categoryLabel(item.category)}
              </div>
            </div>
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
            {item.format === 'playbook' && item.playbookContent && (
              <Meta icon={ListChecks} label={`${item.playbookContent.length} steps`} />
            )}
            <Meta
              icon={Eye}
              label={`${fmtViews(deriveViews(item))} views · item ${feedIdx + 1} / ${feedTotal}`}
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

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
            <button
              onClick={onLearnMore}
              style={{
                background: BLUE,
                color: '#fff',
                border: 'none',
                padding: '14px 24px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: `0 8px 20px ${BLUE}55`,
              }}
            >
              Learn more <ArrowRight size={16} />
            </button>
          </div>
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
            blockColor={blockColor}
            variant="desktop-immersive"
            direction={navDirection}
            reducedMotion={reducedMotion}
            isPlaying={isPlaying}
            isSaved={isSaved}
            autoplayMode={autoplayMode}
            onPlay={onPlay}
            onPause={onPause}
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
  isSaved,
  activeCategory,
  setCategory,
  onLearnMore,
  onSave,
  onShare,
  onSearch,
  feedDeckRef,
  navDirection,
  reducedMotion,
  isPlaying,
  autoplayMode,
  onPlay,
  onPause,
  onAutoplayModeChange,
  onPlayerReady,
}: StageProps) {
  return (
    <div
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
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: BLUE,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: 900,
            fontSize: 14,
          }}
        >
          m
        </div>
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
            label={c.shortLabel}
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
          blockColor={CATEGORY_BLOCK_BG[item.category]}
          variant="mobile"
          direction={navDirection}
          reducedMotion={reducedMotion}
          isPlaying={isPlaying}
          isSaved={isSaved}
          autoplayMode={autoplayMode}
          onPlay={onPlay}
          onPause={onPause}
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
          <MobileRailBtn icon={Heart} label={fmtViews(deriveViews(item))} />
          <MobileRailBtn
            icon={isSaved ? BookmarkCheck : Bookmark}
            label="Save"
            active={isSaved}
            onClick={onSave}
          />
          <MobileRailBtn icon={Share2} label="Share" onClick={onShare} />

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

        {/* Learn More — overlaid bottom */}
        <div
          style={{
            position: 'absolute',
            left: 16,
            right: 80,
            bottom: 18,
            zIndex: 7,
          }}
        >
          <button
            onClick={onLearnMore}
            style={{
              width: '100%',
              background: BLUE,
              color: '#fff',
              border: 'none',
              padding: '13px 18px',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 8px 24px rgba(0,146,255,0.45)',
            }}
          >
            Learn more <ArrowRight size={14} />
          </button>
        </div>
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
  blockColor,
  variant,
  direction,
  reducedMotion,
  isPlaying,
  isSaved,
  autoplayMode,
  onPlay,
  onPause,
  onSave,
  onShare,
  onLearnMore,
  onAutoplayModeChange,
  onPlayerReady,
}: {
  deckRef: RefObject<HTMLDivElement | null>;
  item: LaunchpadContent;
  blockColor: string;
  variant: FeedMediaVariant;
  direction: FeedDirection;
  reducedMotion: boolean;
  isPlaying: boolean;
  isSaved: boolean;
  autoplayMode: AutoplayMode;
  onPlay: () => void;
  onPause: () => void;
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
    if (!transitioning || reducedMotion) {
      return { position: 'absolute', inset: 0, transform: 'translate3d(0, 0, 0)', opacity: 1 };
    }

    const enteringFrom = transitionDirection === 'next' ? '100%' : '-100%';
    const exitingTo = transitionDirection === 'next' ? '-100%' : '100%';
    const isPreparing = transitionPhase === 'prepare';

    return {
      position: 'absolute',
      inset: 0,
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
            variant={variant}
            isPlaying={false}
            autoplayMode={autoplayMode}
            onPlay={onPlay}
            onPause={onPause}
            onAutoplayModeChange={onAutoplayModeChange}
            onPlayerReady={onPlayerReady}
          />
        </div>
      )}
      <div data-testid={`feed-media-card-${current.item.id}`} style={cardStyle('current')}>
        {!isMobileVariant && <ImmersiveBackdrop item={current.item} />}
        <MediaStage
          item={current.item}
          variant={variant}
          isPlaying={isPlaying}
          autoplayMode={autoplayMode}
          onPlay={onPlay}
          onPause={onPause}
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
  onLearnMore: () => void;
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
        icon={isSaved ? BookmarkCheck : Bookmark}
        label={isSaved ? 'Saved' : 'Save'}
        active={isSaved}
        onClick={onSave}
      />
      <DesktopRailBtn icon={Share2} label="Share" onClick={onShare} />
      <DesktopRailBtn icon={Info} label="More" onClick={onLearnMore} />
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
  onPlayerReady,
}: {
  videoId: string;
  title: string;
  autoplayMode: AutoplayMode;
  onAutoplayModeChange: (mode: AutoplayMode) => void;
  onPlayerReady: (player: YouTubePlayerInstance | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const playedRef = useRef(false);
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
  }, [onAutoplayModeChange, onPlayerReady, title, videoId]);

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
  variant,
  isPlaying,
  autoplayMode,
  onPlay,
  onPause,
  onAutoplayModeChange,
  onPlayerReady,
}: {
  item: LaunchpadContent;
  variant: FeedMediaVariant;
  isPlaying: boolean;
  autoplayMode: AutoplayMode;
  onPlay: () => void;
  onPause: () => void;
  onAutoplayModeChange: (mode: AutoplayMode) => void;
  onPlayerReady: (player: YouTubePlayerInstance | null) => void;
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
              padding: '20px 20px 92px',
              display: 'flex',
              alignItems: 'flex-end',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              {item.title}
            </div>
          </div>
        )}
        {item.format === 'playbook' && item.playbookContent && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '20px 20px 92px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              color: '#fff',
            }}
          >
            {item.playbookContent.slice(0, 3).map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.22)',
                    backdropFilter: 'blur(6px)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </span>
                {step}
              </div>
            ))}
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
        height: 'min(calc(100% - 48px), 860px)',
        maxWidth: 'calc(100% - 112px)',
        width: 'auto',
        margin: '24px auto',
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
        <FormatBadge type={item.format} top={44} left={14} />
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
              padding: '32px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              color: '#fff',
            }}
          >
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
        )}
        {item.format === 'playbook' && item.playbookContent && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '32px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              color: '#fff',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.85,
                marginBottom: 12,
              }}
            >
              Playbook
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {item.playbookContent.slice(0, 4).map((step, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.22)',
                      backdropFilter: 'blur(6px)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
  const labels: Record<ContentFormat, string> = { video: 'Video', article: 'Article', playbook: 'Playbook' };
  const Cmp = FORMAT_ICON[type];
  return (
    <div style={{ position: 'absolute', top, left, zIndex: 3 }}>
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
        {labels[type]}
      </span>
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
        <IconCmp size={21} />
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
        <IconCmp size={16} />
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
  mobile,
  onClose,
  onPick,
}: {
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
    if (!q.trim()) return launchpadContent.slice(0, 6);
    const needle = q.trim().toLowerCase();
    return launchpadContent.filter((entry) =>
      [entry.title, entry.description, entry.category, entry.format]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [q]);

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
            placeholder="Search careers, skills, playbooks…"
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
                    <span>{entry.format}</span> · <span>{categoryLabel(entry.category)}</span>
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
// Synthesize a stable view count from id so the social rail has a believable number.
function deriveViews(item: LaunchpadContent): number {
  let hash = 0;
  for (let i = 0; i < item.id.length; i += 1) {
    hash = (hash * 31 + item.id.charCodeAt(i)) >>> 0;
  }
  return 800 + (hash % 38000);
}

function pullQuoteFor(item: LaunchpadContent): string {
  if (item.format === 'playbook') return 'A small advantage you can use this week. No assignment required.';
  if (item.format === 'article') return 'Selected by myBlueprint editorial - vetted, recent, Canadian.';
  return 'Real workdays, real Canadians. Not a recruitment ad.';
}

// Suppress unused import warning on Clipboard — kept available for future share UI.
void Clipboard;
