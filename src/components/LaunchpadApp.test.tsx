import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { launchpadContent } from '@/data/content';

import { LaunchpadApp } from './LaunchpadApp';

type PlayerEvents = {
  onReady?: () => void;
  onStateChange?: (event: { data: number }) => void;
  onAutoplayBlocked?: () => void;
};

type MockPlayer = {
  videoId: string;
  state: 'idle' | 'playing' | 'paused' | 'destroyed';
  pausedBeforeDestroy: boolean;
  events: PlayerEvents;
  playVideo: ReturnType<typeof vi.fn>;
  pauseVideo: ReturnType<typeof vi.fn>;
  mute: ReturnType<typeof vi.fn>;
  unMute: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

const players: MockPlayer[] = [];
let reducedMotion = false;

function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function installYouTubeMock() {
  players.length = 0;
  const Player = vi.fn(function MockYTPlayer(
    this: MockPlayer,
    _element: HTMLElement,
    options: { videoId: string; events: PlayerEvents }
  ) {
    const iframe = document.createElement('iframe');
    _element.appendChild(iframe);
    this.videoId = options.videoId;
    this.state = 'idle';
    this.pausedBeforeDestroy = false;
    this.events = options.events;
    this.playVideo = vi.fn(() => {
      this.state = 'playing';
    });
    this.pauseVideo = vi.fn(() => {
      this.state = 'paused';
      this.pausedBeforeDestroy = true;
    });
    this.mute = vi.fn();
    this.unMute = vi.fn();
    this.destroy = vi.fn(() => {
      this.state = 'destroyed';
    });
    players.push(this);
  });

  Object.defineProperty(window, 'YT', {
    configurable: true,
    writable: true,
    value: {
      PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0 },
      Player,
    },
  });
}

function renderLaunchpad() {
  return render(<LaunchpadApp />);
}

function feedDeck() {
  return screen.getByTestId('feed-media-deck');
}

function desktopRail() {
  return screen.getByTestId('desktop-overlay-rail');
}

function expectHeading(title: string) {
  const collapsedTitle = title.replace(/\s+/g, '');
  return expect(screen.getByRole('heading', { name: new RegExp(collapsedTitle, 'i') })).toBeInTheDocument();
}

function dispatchWheel(target: Element, deltaY: number, deltaX = 0) {
  target.dispatchEvent(new WheelEvent('wheel', { deltaY, deltaX, bubbles: true, cancelable: true }));
}

function dispatchTouch(target: Element, type: string, x: number, y: number) {
  const touch = { clientX: x, clientY: y, identifier: 1, target };
  const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
  Object.defineProperty(event, 'touches', {
    value: type === 'touchend' ? [] : [touch],
  });
  Object.defineProperty(event, 'changedTouches', {
    value: [touch],
  });
  target.dispatchEvent(event);
  return event;
}

async function finishTransition() {
  await act(async () => {
    vi.advanceTimersByTime(340);
  });
}

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
  });
  await vi.dynamicImportSettled();
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  reducedMotion = false;
  installMatchMedia();
  installYouTubeMock();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('LaunchpadApp feed navigation', () => {
  it('registers cancelable wheel and touchmove listeners on the feed deck and advances once for wheel inertia', async () => {
    const elementAdd = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const windowAdd = vi.spyOn(window, 'addEventListener');

    renderLaunchpad();

    expect(elementAdd).toHaveBeenCalledWith('wheel', expect.any(Function), { passive: false });
    expect(elementAdd).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
    expect(windowAdd).not.toHaveBeenCalledWith('wheel', expect.any(Function), expect.anything());

    const deck = feedDeck();
    act(() => {
      dispatchWheel(deck, 42);
      dispatchWheel(deck, 46);
      dispatchWheel(deck, 120);
    });

    await finishTransition();

    expectHeading('The Skills That Travel With You');
    expect(screen.getByText(/item 2 \/ 16/i)).toBeInTheDocument();
  });

  it('axis-locks vertical touch movement, prevents default only after lock, and ignores horizontal gestures', async () => {
    renderLaunchpad();
    const deck = feedDeck();

    act(() => {
      dispatchTouch(deck, 'touchstart', 100, 300);
    });
    const verticalMove = dispatchTouch(deck, 'touchmove', 104, 236);

    expect(verticalMove.defaultPrevented).toBe(true);
    await finishTransition();
    expectHeading('The Skills That Travel With You');

    act(() => {
      dispatchTouch(deck, 'touchstart', 100, 300);
    });
    const horizontalMove = dispatchTouch(deck, 'touchmove', 172, 292);

    expect(horizontalMove.defaultPrevented).toBe(false);
    await finishTransition();
    expectHeading('The Skills That Travel With You');
  });

  it('keeps edge navigation as a no-op with no transition animation', async () => {
    renderLaunchpad();
    const deck = feedDeck();

    act(() => {
      dispatchWheel(deck, -120);
    });
    await finishTransition();

    expectHeading('AI Tools That Make Schoolwork Less Messy');
    expect(deck).toHaveAttribute('data-transitioning', 'false');
  });

  it('uses keyboard navigation and ignores shortcuts from interactive controls', async () => {
    renderLaunchpad();

    fireEvent.keyDown(window, { key: 'j' });
    await finishTransition();
    expectHeading('The Skills That Travel With You');

    screen.getByRole('button', { name: /learn more/i }).focus();
    fireEvent.keyDown(window, { key: 'k' });
    await finishTransition();

    expectHeading('The Skills That Travel With You');
  });

  it('skips slide transitions and the first-session nudge for reduced-motion users', async () => {
    reducedMotion = true;
    installMatchMedia();
    renderLaunchpad();

    act(() => {
      dispatchWheel(feedDeck(), 90);
      vi.advanceTimersByTime(500);
    });

    expectHeading('The Skills That Travel With You');
    expect(feedDeck()).toHaveAttribute('data-transitioning', 'false');
    expect(feedDeck()).toHaveAttribute('data-nudging', 'false');
  });

  it('runs the first-session card nudge once and stores suppression in sessionStorage', () => {
    const { unmount } = renderLaunchpad();

    expect(feedDeck()).toHaveAttribute('data-nudging', 'false');
    act(() => {
      vi.advanceTimersByTime(420);
    });
    expect(feedDeck()).toHaveAttribute('data-nudging', 'true');
    act(() => {
      vi.advanceTimersByTime(520);
    });
    expect(feedDeck()).toHaveAttribute('data-nudging', 'false');
    expect(window.sessionStorage.getItem('career-launchpad-feed-nudge-seen')).toBe('true');

    unmount();
    renderLaunchpad();
    act(() => {
      vi.advanceTimersByTime(420);
    });

    expect(feedDeck()).toHaveAttribute('data-nudging', 'false');
  });

  it('renders the desktop immersive backdrop from the current thumbnail', () => {
    renderLaunchpad();

    expect(screen.getByTestId('desktop-immersive-backdrop')).toHaveAttribute(
      'src',
      launchpadContent[0].thumbnailUrl
    );
  });

  it('does not render source-type labels in the feed or Learn More panel', async () => {
    renderLaunchpad();
    const sourceLabels = ['Curated', 'Clipped', 'Original', 'Partner'];

    sourceLabels.forEach((label) => {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /learn more/i }));
    await flushAsyncWork();
    const dialog = screen.getByRole('dialog', { name: /ai tools that make schoolwork/i });

    sourceLabels.forEach((label) => {
      expect(within(dialog).queryByText(label)).not.toBeInTheDocument();
    });
  });

  it('uses the desktop immersive rail without the old Heart view-count action', () => {
    renderLaunchpad();
    const rail = within(desktopRail());

    expect(rail.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(rail.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(rail.getByRole('button', { name: 'More' })).toBeInTheDocument();
    expect(rail.queryByRole('button', { name: /^[\d.]+K?$/ })).not.toBeInTheDocument();
  });

  it('keeps focus order from left Learn More to play, Save, Share, and More', () => {
    renderLaunchpad();

    const buttons = screen.getAllByRole('button');
    const learnMoreIdx = buttons.indexOf(screen.getByRole('button', { name: /learn more/i }));
    const playIdx = buttons.indexOf(screen.getByRole('button', { name: /play ai tools/i }));
    const saveIdx = buttons.indexOf(within(desktopRail()).getByRole('button', { name: 'Save' }));
    const shareIdx = buttons.indexOf(within(desktopRail()).getByRole('button', { name: 'Share' }));
    const moreIdx = buttons.indexOf(within(desktopRail()).getByRole('button', { name: 'More' }));

    expect([learnMoreIdx, playIdx, saveIdx, shareIdx, moreIdx]).toEqual(
      [...[learnMoreIdx, playIdx, saveIdx, shareIdx, moreIdx]].sort((a, b) => a - b)
    );
  });
});

describe('LaunchpadApp playback', () => {
  it('creates a YouTube player after a user play intent and falls back to muted autoplay if playback does not start', () => {
    renderLaunchpad();

    fireEvent.click(screen.getByRole('button', { name: /play ai tools/i }));
    expect(players).toHaveLength(1);

    act(() => {
      players[0].events.onReady?.();
    });
    expect(players[0].playVideo).toHaveBeenCalledTimes(1);
    expect(players[0].mute).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(players[0].mute).toHaveBeenCalledTimes(1);
    expect(players[0].playVideo).toHaveBeenCalledTimes(2);
  });

  it('sizes the YouTube iframe to fill the media frame instead of the API default', () => {
    renderLaunchpad();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /play ai tools/i }));
    });
    const host = screen.getByTestId('youtube-host-5MgBikgcWnY');
    const mount = host.firstElementChild as HTMLElement;

    expect(mount).toHaveStyle({
      position: 'absolute',
      width: '100%',
      height: '100%',
    });

    act(() => {
      players[0].events.onReady?.();
    });

    const iframe = host.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.style.position).toBe('absolute');
    expect(iframe.style.width).toBe('100%');
    expect(iframe.style.height).toBe('100%');
    expect(iframe.style.border).toBe('0px');
    expect(iframe.style.display).toBe('block');
  });

  it('uses muted mode immediately when the browser reports allowed-muted autoplay', () => {
    Object.defineProperty(window.navigator, 'getAutoplayPolicy', {
      configurable: true,
      value: vi.fn(() => 'allowed-muted'),
    });
    renderLaunchpad();

    fireEvent.click(screen.getByRole('button', { name: /play ai tools/i }));
    act(() => {
      players[0].events.onReady?.();
    });

    expect(players[0].mute).toHaveBeenCalledBefore(players[0].playVideo);
  });

  it('captures scroll over the playing iframe overlay and stops playback on non-video content', async () => {
    renderLaunchpad();

    fireEvent.click(screen.getByRole('button', { name: /play ai tools/i }));
    act(() => {
      players[0].events.onReady?.();
      players[0].events.onStateChange?.({ data: 1 });
    });

    const overlay = screen.getByTestId('youtube-scroll-overlay');
    act(() => {
      dispatchWheel(overlay, 90);
    });
    await finishTransition();

    expectHeading('The Skills That Travel With You');
    expect(screen.queryByTestId('youtube-scroll-overlay')).not.toBeInTheDocument();
    expect(players[0].destroy).toHaveBeenCalled();
  });

  it('captures wheel navigation from desktop rail buttons while a video is playing', async () => {
    renderLaunchpad();

    fireEvent.click(screen.getByRole('button', { name: /play ai tools/i }));
    act(() => {
      players[0].events.onReady?.();
      players[0].events.onStateChange?.({ data: 1 });
      dispatchWheel(within(desktopRail()).getByRole('button', { name: 'Share' }), 90);
    });
    await finishTransition();

    expectHeading('The Skills That Travel With You');
    expect(screen.queryByTestId('youtube-scroll-overlay')).not.toBeInTheDocument();
  });

  it('carries user-started autoplay between videos and recreates the player when scrolling back', async () => {
    renderLaunchpad();

    fireEvent.click(screen.getByRole('button', { name: /filter by format/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Videos' }));
    fireEvent.click(screen.getByRole('button', { name: /play ai tools/i }));
    act(() => {
      players[0].events.onReady?.();
      players[0].events.onStateChange?.({ data: 1 });
      dispatchWheel(screen.getByTestId('youtube-scroll-overlay'), 90);
    });
    await finishTransition();

    expectHeading('The Career Path Was Not a Straight Line');
    expect(players.at(-1)?.videoId).toBe('arj7oStGLkU');

    act(() => {
      players.at(-1)?.events.onReady?.();
      players.at(-1)?.events.onStateChange?.({ data: 1 });
      dispatchWheel(screen.getByTestId('youtube-scroll-overlay'), -90);
    });
    await finishTransition();

    expectHeading('AI Tools That Make Schoolwork Less Messy');
    expect(players.at(-1)?.videoId).toBe('5MgBikgcWnY');
    expect(players.filter((player) => player.videoId === '5MgBikgcWnY')).toHaveLength(2);
  });

  it('opens Learn More from the desktop More rail action', async () => {
    renderLaunchpad();

    fireEvent.click(within(desktopRail()).getByRole('button', { name: 'More' }));
    await flushAsyncWork();

    expect(screen.getByRole('dialog', { name: /ai tools that make schoolwork/i })).toBeInTheDocument();
  });

  it('pauses playing video before opening Learn More and does not auto-resume on close', async () => {
    renderLaunchpad();

    fireEvent.click(screen.getByRole('button', { name: /play ai tools/i }));
    act(() => {
      players[0].events.onReady?.();
      players[0].events.onStateChange?.({ data: 1 });
    });

    fireEvent.click(within(desktopRail()).getByRole('button', { name: 'More' }));
    await flushAsyncWork();

    expect(players[0].pauseVideo).toHaveBeenCalledTimes(1);
    expect(players[0].pausedBeforeDestroy).toBe(true);
    expect(players[0].state).toBe('destroyed');
    expect(screen.getByRole('dialog', { name: /ai tools that make schoolwork/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    await act(async () => {
      vi.advanceTimersByTime(340);
    });

    expect(players).toHaveLength(1);
    expect(screen.getByRole('button', { name: /play ai tools/i })).toBeInTheDocument();
  });

  it('strips invalid direct content links and explains recovery', async () => {
    window.history.replaceState({}, '', '/?content=missing-slug');

    renderLaunchpad();
    await flushAsyncWork();

    expect(window.location.search).toBe('');
    expect(screen.getByText(/that content is not available anymore/i)).toBeInTheDocument();
  });
});
