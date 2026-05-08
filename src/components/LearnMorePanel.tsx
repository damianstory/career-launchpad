'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowUpRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Clock,
  ExternalLink,
  Play,
  Share2,
  X,
} from 'lucide-react';
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef } from 'react';

import { formatDuration } from '@/lib/content';
import type { ContentFormat, LaunchpadCategory, LaunchpadContent } from '@/types';

const FORMAT_ICON: Record<ContentFormat, typeof Play> = {
  video: Play,
  article: BookOpen,
  playbook: BookOpen,
};

type LearnMorePanelProps = {
  item: LaunchpadContent;
  categories: LaunchpadCategory[];
  related: LaunchpadContent[];
  isSaved: boolean;
  mobile: boolean;
  onClose: () => void;
  onSave: () => void;
  onShare: () => void;
  onRelated: (item: LaunchpadContent) => void;
  onOutboundClick: (href: string) => void;
};

export function LearnMorePanel({
  item,
  categories,
  related,
  isSaved,
  mobile,
  onClose,
  onSave,
  onShare,
  onRelated,
  onOutboundClick,
}: LearnMorePanelProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const relatedRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    onClose();
  }, [onClose]);

  useEffect(() => {
    const y = window.scrollY;
    const previous = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      document.body.style.overflow = previous.overflow;
      if (y > 0) window.scrollTo(0, y);
    };
  }, []);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [item.id]);

  const titleSize = mobile ? 22 : 30;
  const Icon = FORMAT_ICON[item.format];

  return (
    <Dialog.Root
      open
      modal
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          data-testid="learn-more-overlay"
          className="learn-more-overlay"
          onClick={requestClose}
        />
        <Dialog.Content
          className="learn-more-card"
          aria-describedby={undefined}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="learn-more-header">
            <div className="learn-more-meta">
              <span className="learn-more-format">
                <Icon size={13} />
                {item.format}
              </span>
              <span className="learn-more-category">{categoryLabel(categories, item)}</span>
              {item.format === 'video' && item.durationSeconds ? (
                <span className="learn-more-muted">
                  <Clock size={12} />
                  {formatDuration(item.durationSeconds)}
                </span>
              ) : null}
              {item.format === 'article' && item.readingTimeMinutes ? (
                <span className="learn-more-muted">
                  <Clock size={12} />
                  {item.readingTimeMinutes} min read
                </span>
              ) : null}
            </div>
            <div className="learn-more-actions">
              {related.length > 0 ? (
                <button
                  type="button"
                  className="learn-more-action-button learn-more-related-button"
                  onClick={() => relatedRef.current?.scrollIntoView({ block: 'start' })}
                >
                  Related
                </button>
              ) : null}
              <button
                type="button"
                className="learn-more-icon-button"
                aria-label={isSaved ? 'Remove from saves' : 'Save'}
                data-active={isSaved ? 'true' : 'false'}
                onClick={onSave}
              >
                {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              </button>
              <button type="button" className="learn-more-icon-button" aria-label="Share" onClick={onShare}>
                <Share2 size={15} />
              </button>
              <Dialog.Close asChild>
                <button type="button" className="learn-more-icon-button" aria-label="Close">
                  <X size={15} />
                </button>
              </Dialog.Close>
            </div>
          </header>

          <div ref={bodyRef} data-testid="learn-more-body" className="learn-more-body">
            <div className="learn-more-top">
              <div className="learn-more-poster">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnailUrl} alt="" />
                {item.format === 'video' ? (
                  <div className="learn-more-play-marker" aria-hidden="true">
                    <Play size={21} />
                  </div>
                ) : null}
              </div>
              <div className="learn-more-intro">
                <Dialog.Title asChild>
                  <h1
                    style={{
                      fontSize: titleSize,
                      lineHeight: 1.1,
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                      margin: '0 0 12px',
                      textWrap: 'balance' as CSSProperties['textWrap'],
                    }}
                  >
                    {item.title}
                  </h1>
                </Dialog.Title>
                <p className="learn-more-description">{item.description}</p>
                {item.articleUrl ? (
                  <a
                    className="learn-more-outbound"
                    href={item.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => item.articleUrl && onOutboundClick(item.articleUrl)}
                  >
                    <ExternalLink size={16} />
                    {item.articleSourceName ? `Open on ${item.articleSourceName}` : 'Read article'}
                  </a>
                ) : null}
              </div>
            </div>

            {item.learnMore.whyItMatters ? (
              <PanelSection title="Why this matters">{item.learnMore.whyItMatters}</PanelSection>
            ) : null}
            {item.learnMore.planningConnection ? (
              <PanelSection title="How it connects to career planning">
                {item.learnMore.planningConnection}
              </PanelSection>
            ) : null}

            {item.learnMore.takeaway ? (
              <div className="learn-more-takeaway">
                <div>Key takeaway</div>
                <p>{item.learnMore.takeaway}</p>
              </div>
            ) : null}

            {related.length > 0 ? (
              <PanelSection title="Related">
                <div ref={relatedRef} className="learn-more-related-grid">
                  {related.map((entry) => {
                    const RelatedIcon = FORMAT_ICON[entry.format];
                    return (
                      <button
                        type="button"
                        key={entry.id}
                        className="learn-more-related-card"
                        onClick={() => onRelated(entry)}
                      >
                        <span>
                          <RelatedIcon size={12} />
                          {entry.format}
                        </span>
                        <strong>{entry.title}</strong>
                        <ArrowUpRight size={14} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </PanelSection>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="learn-more-section">
      <h2>{title}</h2>
      {typeof children === 'string' ? <p>{children}</p> : children}
    </section>
  );
}

function categoryLabel(categories: LaunchpadCategory[], item: LaunchpadContent): string {
  return categories.find((category) => category.slug === item.primaryCategory)?.name ?? item.primaryCategory;
}
