'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  BookOpen,
  Brain,
  Briefcase,
  Check,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  ListChecks,
  MapPin,
  Play,
  Puzzle,
  Rocket,
  Sparkles,
  X,
} from 'lucide-react';

import { countContentByCategory, countContentByFormat } from '@/lib/content';
import type { CategorySlug, ContentFormat, LaunchpadCategory, LaunchpadContent } from '@/types';

// ---------------------------------------------------------------------------
// Icon maps
// ---------------------------------------------------------------------------
const CATEGORY_ICON: Record<CategorySlug, typeof Rocket> = {
  'emerging-careers': Rocket,
  'on-the-job': Briefcase,
  'life-skills': Lightbulb,
  mindsets: Brain,
  'how-i-got-here': MapPin,
  'problems-to-solve': Puzzle,
  'post-secondary': GraduationCap,
  // Playbook-style listing: ListChecks fits better than generic icon
  'job-board': ListChecks,
};

// Note: Playbook uses ListChecks here (differs from LearnMorePanel's BookOpen).
// BookOpen is retained for article; Play for video.
const FORMAT_ICON: Record<ContentFormat, typeof Play> = {
  video: Play,
  article: BookOpen,
  playbook: ListChecks,
};

// ---------------------------------------------------------------------------
// Copy maps
// ---------------------------------------------------------------------------
const PATH_DESCRIPTION: Record<CategorySlug, string> = {
  'emerging-careers': "Jobs that didn't exist five years ago.",
  'on-the-job': 'A day in the life of real Canadians at work.',
  'life-skills': "The stuff school doesn't teach but adulthood expects.",
  mindsets: 'How successful people actually think about work.',
  'how-i-got-here': 'Real career paths, told by the people who walked them.',
  'problems-to-solve': 'Big problems Canadian workers are trying to solve.',
  'post-secondary': 'College, university, apprenticeship, or none of the above.',
  'job-board': 'Real openings near you, refreshed weekly.',
};

const ALL_PATHS_DESCRIPTION = "Every path. Start here if you don't know where to start.";

const FORMAT_DESCRIPTION: Record<ContentFormat, string> = {
  video: 'Three to five minute videos from real Canadians at work.',
  article: 'Long-form pieces. Four to eight minute reads.',
  playbook: 'Step-by-step guides for figuring something out.',
};

const ALL_FORMATS_DESCRIPTION = 'Every story, regardless of format.';

const FORMAT_LABEL: Record<ContentFormat, string> = {
  video: 'Videos',
  article: 'Articles',
  playbook: 'Playbooks',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type BrowseDrawerProps = {
  mode: 'paths' | 'formats';
  open: boolean;
  mobile: boolean;
  categories: LaunchpadCategory[];
  content: LaunchpadContent[];
  activeCategories: CategorySlug[];
  activeFormat: ContentFormat | null;
  onToggleCategory: (slug: CategorySlug) => void;
  onClearCategories: () => void;
  onPickFormat: (format: ContentFormat | null) => void;
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function BrowseDrawer({
  mode,
  open,
  mobile,
  categories,
  content,
  activeCategories,
  activeFormat,
  onToggleCategory,
  onClearCategories,
  onPickFormat,
  onClose,
}: BrowseDrawerProps) {
  const isPaths = mode === 'paths';
  const eyebrow = isPaths ? 'Browse Paths' : 'Browse Formats';
  const title = isPaths ? 'Where do you want to start?' : 'What format are you in the mood for?';
  const cardClass = mobile ? 'browse-drawer-card browse-drawer-card--mobile' : 'browse-drawer-card';

  // Featured card: "All Paths" (paths) or "All Formats" (formats)
  const featuredIsActive = isPaths ? activeCategories.length === 0 : activeFormat === null;
  const featuredLabel = isPaths ? 'All Paths' : 'All Formats';
  const featuredDescription = isPaths ? ALL_PATHS_DESCRIPTION : ALL_FORMATS_DESCRIPTION;
  const featuredCount = isPaths
    ? countContentByCategory(null, activeFormat, content)
    : countContentByFormat(null, activeCategories, content);

  function handleFeaturedClick() {
    if (isPaths) {
      onClearCategories();
      // Paths drawer stays open (multi-select pattern)
    } else {
      onPickFormat(null);
      // Formats drawer closes via parent's onPickFormat handler
    }
  }

  return (
    <Dialog.Root
      open={open}
      modal
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-testid="browse-drawer-overlay"
          className="learn-more-overlay"
          onClick={onClose}
        />
        <Dialog.Content
          className={cardClass}
          aria-describedby={undefined}
          onClick={(e) => e.stopPropagation()}
          data-testid="browse-drawer"
          data-mode={mode}
        >
          {/* Header */}
          <div className="browse-drawer-header">
            <div>
              <div className="browse-drawer-eyebrow">{eyebrow}</div>
              <Dialog.Title className="browse-drawer-title">{title}</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="browse-drawer-close"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="browse-drawer-body">
            {/* Featured card: All Paths / All Formats */}
            <button
              type="button"
              className={`browse-drawer-card-tile browse-drawer-card-tile--featured${featuredIsActive ? ' is-active' : ''}`}
              onClick={handleFeaturedClick}
              data-active={featuredIsActive ? 'true' : 'false'}
              aria-pressed={featuredIsActive}
            >
              {featuredIsActive && (
                <div className="browse-drawer-card-banner" aria-hidden="true">
                  <Check size={12} />
                  <span>Selected</span>
                </div>
              )}
              <div className="browse-drawer-icon-tile">
                <Sparkles size={18} />
              </div>
              <div className="browse-drawer-card-info">
                <div className="browse-drawer-card-name">{featuredLabel}</div>
                <div className="browse-drawer-card-desc">{featuredDescription}</div>
              </div>
              <div className="browse-drawer-card-count">
                {featuredCount} {featuredCount === 1 ? 'story' : 'stories'}
              </div>
              <ChevronRight size={14} className="browse-drawer-card-chevron" aria-hidden="true" />
            </button>

            {/* Grid of path / format cards */}
            <div className={`browse-drawer-grid ${isPaths ? 'is-paths' : 'is-formats'}`}>
              {isPaths
                ? categories.map((cat) => {
                    const Icon = CATEGORY_ICON[cat.slug];
                    const isActive = activeCategories.includes(cat.slug);
                    const count = countContentByCategory(cat.slug, activeFormat, content);
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        className={`browse-drawer-card-tile${isActive ? ' is-active' : ''}`}
                        onClick={() => onToggleCategory(cat.slug)}
                        data-active={isActive ? 'true' : 'false'}
                        aria-pressed={isActive}
                        data-slug={cat.slug}
                      >
                        {isActive && (
                          <div className="browse-drawer-card-banner" aria-hidden="true">
                            <Check size={12} />
                            <span>Selected</span>
                          </div>
                        )}
                        <div className="browse-drawer-icon-tile">
                          {Icon ? <Icon size={16} /> : null}
                        </div>
                        <div className="browse-drawer-card-name">{cat.name}</div>
                        <div className="browse-drawer-card-desc">{PATH_DESCRIPTION[cat.slug]}</div>
                        <div className="browse-drawer-card-count">
                          {count} {count === 1 ? 'story' : 'stories'}
                        </div>
                      </button>
                    );
                  })
                : (['video', 'article', 'playbook'] as ContentFormat[]).map((fmt) => {
                    const Icon = FORMAT_ICON[fmt];
                    const isActive = activeFormat === fmt;
                    const count = countContentByFormat(fmt, activeCategories, content);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        className={`browse-drawer-card-tile${isActive ? ' is-active' : ''}`}
                        onClick={() => onPickFormat(fmt)}
                        data-active={isActive ? 'true' : 'false'}
                        aria-pressed={isActive}
                        data-format={fmt}
                      >
                        {isActive && (
                          <div className="browse-drawer-card-banner" aria-hidden="true">
                            <Check size={12} />
                            <span>Selected</span>
                          </div>
                        )}
                        <div className="browse-drawer-icon-tile">
                          <Icon size={16} />
                        </div>
                        <div className="browse-drawer-card-name">{FORMAT_LABEL[fmt]}</div>
                        <div className="browse-drawer-card-desc">{FORMAT_DESCRIPTION[fmt]}</div>
                        <div className="browse-drawer-card-count">
                          {count} {count === 1 ? 'story' : 'stories'}
                        </div>
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* Done button — paths drawer only */}
          {isPaths && (
            <div className="browse-drawer-footer">
              <button
                type="button"
                className="browse-drawer-done-button"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
