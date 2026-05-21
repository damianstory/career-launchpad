import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { getRelatedContent } from '@/lib/content';
import { fixtureCategories, fixtureContent } from '@/test/fixtures/content';

import { LearnMorePanel } from './LearnMorePanel';

function renderPanel(overrides: Partial<ComponentProps<typeof LearnMorePanel>> = {}) {
  const item = overrides.item ?? fixtureContent.find((entry) => entry.format === 'article') ?? fixtureContent[0];
  const related = overrides.related ?? getRelatedContent(fixtureContent, item);
  const props: ComponentProps<typeof LearnMorePanel> = {
    item,
    categories: fixtureCategories,
    related,
    isSaved: false,
    mobile: false,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onShare: vi.fn(),
    onRelated: vi.fn(),
    onOutboundClick: vi.fn(),
    ...overrides,
  };

  return { props, ...render(<LearnMorePanel {...props} />) };
}

describe('LearnMorePanel', () => {
  it('renders articles as outbound-only previews without an iframe', () => {
    const article = fixtureContent.find((entry) => entry.id === 'article-first-internship');
    if (!article) throw new Error('Missing article fixture');

    const { props } = renderPanel({ item: article });

    const dialog = screen.getByRole('dialog', { name: /what your first internship/i });
    expect(within(dialog).getByRole('heading', { name: article.title })).toBeInTheDocument();
    expect(within(dialog).queryByTitle(article.title)).not.toBeInTheDocument();

    const outbound = within(dialog).getByRole('link', { name: /open on indeed/i });
    expect(outbound).toHaveAttribute('href', article.articleUrl);
    expect(outbound).toHaveAttribute('target', '_blank');
    expect(outbound).toHaveAttribute('rel', expect.stringContaining('noopener'));

    fireEvent.click(outbound);
    expect(props.onOutboundClick).toHaveBeenCalledWith(article.articleUrl);
  });

  it('closes from Escape, overlay click, and the close button', () => {
    const escapeRender = renderPanel();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(escapeRender.props.onClose).toHaveBeenCalledTimes(1);
    escapeRender.unmount();

    const overlayRender = renderPanel();
    fireEvent.click(screen.getByTestId('learn-more-overlay'));
    expect(overlayRender.props.onClose).toHaveBeenCalledTimes(1);
    overlayRender.unmount();

    const buttonRender = renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(buttonRender.props.onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps keyboard focus inside the dialog when tabbing', async () => {
    const user = userEvent.setup();
    renderPanel();

    const dialog = screen.getByRole('dialog');
    await user.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('uses Like and Unlike labels for the saved action', () => {
    const unsavedRender = renderPanel({ isSaved: false });

    expect(screen.getByRole('button', { name: 'Like' })).toHaveAttribute('data-active', 'false');
    unsavedRender.unmount();

    renderPanel({ isSaved: true });

    expect(screen.getByRole('button', { name: 'Unlike' })).toHaveAttribute('data-active', 'true');
  });

  it('does not render a thumbnail image or play marker inside the modal', () => {
    const video = fixtureContent.find((entry) => entry.id === 'video-ai-tools');
    if (!video) throw new Error('Missing video fixture');

    renderPanel({ item: video });

    const dialog = screen.getByRole('dialog');
    const thumbImg = within(dialog)
      .queryAllByRole('img', { hidden: true })
      .find((img) => img.getAttribute('src') === video.thumbnailUrl);
    expect(thumbImg).toBeUndefined();
    expect(dialog.querySelector('.learn-more-poster')).toBeNull();
    expect(dialog.querySelector('.learn-more-play-marker')).toBeNull();
  });

  it('renders the Reflection card when item.learnMore.reflection is set', () => {
    const video = fixtureContent.find((entry) => entry.id === 'video-ai-tools');
    if (!video?.learnMore.reflection) throw new Error('Fixture must include a reflection');

    renderPanel({ item: video });

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/^reflection$/i)).toBeInTheDocument();
    expect(within(dialog).getByText(video.learnMore.reflection)).toBeInTheDocument();
  });

  it('swaps related content without closing and resets the scroll container to the top', () => {
    const item = fixtureContent[0];
    const related = getRelatedContent(fixtureContent, item);
    const onRelated = vi.fn();
    const { rerender } = renderPanel({ item, related, onRelated });
    const body = screen.getByTestId('learn-more-body');

    body.scrollTop = 320;
    fireEvent.click(screen.getByRole('button', { name: new RegExp(related[0].title, 'i') }));
    expect(onRelated).toHaveBeenCalledWith(related[0]);

    rerender(
      <LearnMorePanel
        item={related[0]}
        categories={fixtureCategories}
        related={getRelatedContent(fixtureContent, related[0])}
        isSaved={false}
        mobile={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onShare={vi.fn()}
        onRelated={onRelated}
        onOutboundClick={vi.fn()}
      />
    );

    expect(screen.getByTestId('learn-more-body').scrollTop).toBe(0);
  });
});
