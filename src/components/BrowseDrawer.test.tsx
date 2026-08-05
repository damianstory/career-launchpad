import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fixtureCategories, fixtureContent } from '@/test/fixtures/content';
import type { CategorySlug } from '@/types';

import { BrowseDrawer } from './BrowseDrawer';

function renderPathsDrawer(overrides: Partial<Parameters<typeof BrowseDrawer>[0]> = {}) {
  const onToggleCategory = vi.fn();
  const onClearCategories = vi.fn();
  const onPickFormat = vi.fn();
  const onClose = vi.fn();

  render(
    <BrowseDrawer
      mode="paths"
      open={true}
      mobile={false}
      categories={fixtureCategories}
      content={fixtureContent}
      activeCategories={[]}
      activeFormat={null}
      onToggleCategory={onToggleCategory}
      onClearCategories={onClearCategories}
      onPickFormat={onPickFormat}
      onClose={onClose}
      {...overrides}
    />
  );

  return { onToggleCategory, onClearCategories, onPickFormat, onClose };
}

function renderFormatsDrawer(overrides: Partial<Parameters<typeof BrowseDrawer>[0]> = {}) {
  const onToggleCategory = vi.fn();
  const onClearCategories = vi.fn();
  const onPickFormat = vi.fn();
  const onClose = vi.fn();

  render(
    <BrowseDrawer
      mode="formats"
      open={true}
      mobile={false}
      categories={fixtureCategories}
      content={fixtureContent}
      activeCategories={[]}
      activeFormat={null}
      onToggleCategory={onToggleCategory}
      onClearCategories={onClearCategories}
      onPickFormat={onPickFormat}
      onClose={onClose}
      {...overrides}
    />
  );

  return { onToggleCategory, onClearCategories, onPickFormat, onClose };
}

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('BrowseDrawer — paths mode', () => {
  it('renders the paths drawer with correct title and eyebrow', () => {
    renderPathsDrawer();

    expect(screen.getByText('Browse Paths')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /where do you want to start/i })).toBeInTheDocument();
  });

  it('renders the All Paths featured card at the top', () => {
    renderPathsDrawer();

    const drawer = screen.getByRole('dialog');
    expect(within(drawer).getByRole('button', { name: /All Paths/i })).toBeInTheDocument();
  });

  it('renders path cards for every category', () => {
    renderPathsDrawer();

    const drawer = screen.getByRole('dialog');
    const categoryButtons = fixtureCategories.map((cat) =>
      within(drawer).getByRole('button', { name: new RegExp(cat.name, 'i') })
    );
    expect(categoryButtons).toHaveLength(fixtureCategories.length);
  });

  it('renders Skilled Trades first with its count and description', () => {
    // Content ids keep the historical skills-canada- prefix; only the category slug changed.
    const skilledTradesContent = Array.from({ length: 160 }, (_, index) => ({
      ...fixtureContent[0],
      id: `skills-canada-${index + 1}`,
      slug: `skills-canada-${index + 1}`,
      categories: ['skilled-trades', 'on-the-job'] as CategorySlug[],
      primaryCategory: 'skilled-trades' as CategorySlug,
    }));

    renderPathsDrawer({ content: skilledTradesContent });

    const drawer = screen.getByRole('dialog');
    const firstPathCard = drawer.querySelector('[data-slug]');
    expect(firstPathCard).toHaveAttribute('data-slug', 'skilled-trades');
    expect(firstPathCard).toHaveTextContent('160 stories');
    expect(firstPathCard).toHaveTextContent('Hands-on careers where skill pays: build, fix, make, and run real things.');
  });

  it('calls onToggleCategory with the slug when a path card is clicked', () => {
    const { onToggleCategory } = renderPathsDrawer();

    fireEvent.click(screen.getByRole('button', { name: /Mindsets/i }));
    expect(onToggleCategory).toHaveBeenCalledWith('mindsets');
    expect(onToggleCategory).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when a path card is clicked (drawer stays open)', () => {
    const { onClose } = renderPathsDrawer();

    fireEvent.click(screen.getByRole('button', { name: /Mindsets/i }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClearCategories when the All Paths featured card is clicked', () => {
    const { onClearCategories } = renderPathsDrawer({ activeCategories: ['mindsets'] });

    fireEvent.click(screen.getByRole('button', { name: /All Paths/i }));
    expect(onClearCategories).toHaveBeenCalledTimes(1);
  });

  it('marks the active category card with data-active=true', () => {
    renderPathsDrawer({ activeCategories: ['mindsets'] });

    const mindsets = screen.getByRole('button', { name: /Mindsets/i });
    expect(mindsets).toHaveAttribute('data-active', 'true');

    const emerging = screen.getByRole('button', { name: /Emerging Careers/i });
    expect(emerging).toHaveAttribute('data-active', 'false');
  });

  it('marks multiple path cards as active when activeCategories includes multiple slugs', () => {
    renderPathsDrawer({ activeCategories: ['mindsets', 'life-skills'] });

    expect(screen.getByRole('button', { name: /Mindsets/i })).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('button', { name: /Life Skills/i })).toHaveAttribute('data-active', 'true');
    expect(screen.getByRole('button', { name: /Emerging Careers/i })).toHaveAttribute('data-active', 'false');
  });

  it('marks the All Paths card as active when no categories are selected', () => {
    renderPathsDrawer({ activeCategories: [] });

    const allPaths = screen.getByRole('button', { name: /All Paths/i });
    expect(allPaths).toHaveAttribute('data-active', 'true');
  });

  it('shows the SELECTED banner on every active card', () => {
    renderPathsDrawer({ activeCategories: ['mindsets'] });

    const mindsetsCard = screen.getByRole('button', { name: /Mindsets/i });
    // The banner is aria-hidden so we query by class inside the button element
    const banner = mindsetsCard.querySelector('.browse-drawer-card-banner');
    expect(banner).toBeInTheDocument();
  });

  it('does not show the SELECTED banner on inactive cards', () => {
    renderPathsDrawer({ activeCategories: ['mindsets'] });

    const emergingCard = screen.getByRole('button', { name: /Emerging Careers/i });
    expect(emergingCard.querySelector('.browse-drawer-card-banner')).not.toBeInTheDocument();
  });

  it('shows the SELECTED banner on the All Paths card when no category is selected', () => {
    renderPathsDrawer({ activeCategories: [] });

    const allPathsCard = screen.getByRole('button', { name: /All Paths/i });
    expect(allPathsCard.querySelector('.browse-drawer-card-banner')).toBeInTheDocument();
  });

  it('does not call onPickFormat when a path card is clicked', () => {
    const { onPickFormat } = renderPathsDrawer();

    fireEvent.click(screen.getByRole('button', { name: /Mindsets/i }));
    expect(onPickFormat).not.toHaveBeenCalled();
  });

  it('shows story counts on path cards', () => {
    renderPathsDrawer();

    // life-skills has 1 video in fixtureContent
    const lifeSkillsCard = screen.getByRole('button', { name: /Life Skills/i });
    expect(lifeSkillsCard).toHaveTextContent(/1 stor/i);
  });

  it('reflects the active format cross-filter in story counts', () => {
    // With format=article, life-skills (which has only a video) should show 0 stories
    renderPathsDrawer({ activeFormat: 'article' });

    const lifeSkillsCard = screen.getByRole('button', { name: /Life Skills/i });
    expect(lifeSkillsCard).toHaveTextContent(/0 stor/i);
  });

  it('renders the Done button in paths mode', () => {
    renderPathsDrawer();

    expect(screen.getByRole('button', { name: /Done/i })).toBeInTheDocument();
  });

  it('calls onClose when the Done button is clicked', () => {
    const { onClose } = renderPathsDrawer();

    fireEvent.click(screen.getByRole('button', { name: /Done/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('BrowseDrawer — formats mode', () => {
  it('renders the formats drawer with correct title and eyebrow', () => {
    renderFormatsDrawer();

    expect(screen.getByText('Browse Formats')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /what format are you in the mood for/i })).toBeInTheDocument();
  });

  it('renders the All Formats featured card at the top', () => {
    renderFormatsDrawer();

    const drawer = screen.getByRole('dialog');
    expect(within(drawer).getByRole('button', { name: /All Formats/i })).toBeInTheDocument();
  });

  it('renders 2 format cards (Videos, Articles) and no Playbooks card', () => {
    renderFormatsDrawer();

    const drawer = screen.getByRole('dialog');
    expect(drawer.querySelectorAll('[data-format]')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Videos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Articles/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Playbooks/i })).not.toBeInTheDocument();
  });

  it('calls onPickFormat with the format when a format card is clicked', () => {
    const { onPickFormat } = renderFormatsDrawer();

    fireEvent.click(screen.getByRole('button', { name: /Videos/i }));
    expect(onPickFormat).toHaveBeenCalledWith('video');
    expect(onPickFormat).toHaveBeenCalledTimes(1);
  });

  it('calls onPickFormat with null when the All Formats card is clicked', () => {
    const { onPickFormat } = renderFormatsDrawer({ activeFormat: 'video' });

    fireEvent.click(screen.getByRole('button', { name: /All Formats/i }));
    expect(onPickFormat).toHaveBeenCalledWith(null);
  });

  it('marks the active format card with data-active=true', () => {
    renderFormatsDrawer({ activeFormat: 'video' });

    const videos = screen.getByRole('button', { name: /Videos/i });
    expect(videos).toHaveAttribute('data-active', 'true');

    const articles = screen.getByRole('button', { name: /Articles/i });
    expect(articles).toHaveAttribute('data-active', 'false');
  });

  it('marks the All Formats card as active when no format filter is set', () => {
    renderFormatsDrawer({ activeFormat: null });

    const allFormats = screen.getByRole('button', { name: /All Formats/i });
    expect(allFormats).toHaveAttribute('data-active', 'true');
  });

  it('shows the SELECTED banner on the active format card', () => {
    renderFormatsDrawer({ activeFormat: 'video' });

    const videosCard = screen.getByRole('button', { name: /Videos/i });
    expect(videosCard.querySelector('.browse-drawer-card-banner')).toBeInTheDocument();
  });

  it('does not show the SELECTED banner on inactive format cards', () => {
    renderFormatsDrawer({ activeFormat: 'video' });

    const articlesCard = screen.getByRole('button', { name: /Articles/i });
    expect(articlesCard.querySelector('.browse-drawer-card-banner')).not.toBeInTheDocument();
  });

  it('does not render the Done button in formats mode', () => {
    renderFormatsDrawer();

    expect(screen.queryByRole('button', { name: /Done/i })).not.toBeInTheDocument();
  });

  it('does not call onToggleCategory when a format card is clicked', () => {
    const { onToggleCategory } = renderFormatsDrawer();

    fireEvent.click(screen.getByRole('button', { name: /Videos/i }));
    expect(onToggleCategory).not.toHaveBeenCalled();
  });

  it('reflects the active categories cross-filter in format story counts', () => {
    // mindsets has 1 article in fixtureContent, no videos
    renderFormatsDrawer({ activeCategories: ['mindsets'] });

    const videosCard = screen.getByRole('button', { name: /Videos/i });
    expect(videosCard).toHaveTextContent(/0 stor/i);

    const articlesCard = screen.getByRole('button', { name: /Articles/i });
    expect(articlesCard).toHaveTextContent(/[12] stor/i);
  });
});

describe('BrowseDrawer — close behavior', () => {
  it('does not render content when open=false', () => {
    render(
      <BrowseDrawer
        mode="paths"
        open={false}
        mobile={false}
        categories={fixtureCategories}
        content={fixtureContent}
        activeCategories={[]}
        activeFormat={null}
        onToggleCategory={vi.fn()}
        onClearCategories={vi.fn()}
        onPickFormat={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders as mobile bottom sheet when mobile=true', () => {
    renderPathsDrawer({ mobile: true });

    const content = screen.getByTestId('browse-drawer');
    expect(content).toHaveClass('browse-drawer-card--mobile');
  });

  it('renders as centered modal when mobile=false', () => {
    renderPathsDrawer({ mobile: false });

    const content = screen.getByTestId('browse-drawer');
    expect(content).not.toHaveClass('browse-drawer-card--mobile');
    expect(content).toHaveClass('browse-drawer-card');
  });
});
