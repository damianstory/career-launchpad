import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { launchpadContent } from '@/data/content';
import { getRelatedContent } from '@/lib/content';

import { LearnMorePanel } from './LearnMorePanel';

function renderPanel(overrides: Partial<ComponentProps<typeof LearnMorePanel>> = {}) {
  const item = overrides.item ?? launchpadContent.find((entry) => entry.format === 'article') ?? launchpadContent[0];
  const related = overrides.related ?? getRelatedContent(launchpadContent, item);
  const props: ComponentProps<typeof LearnMorePanel> = {
    item,
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
    const article = launchpadContent.find((entry) => entry.id === 'article-first-internship');
    if (!article) throw new Error('Missing article fixture');

    const { props } = renderPanel({ item: article });

    const dialog = screen.getByRole('dialog', { name: /what your first internship/i });
    expect(within(dialog).getByRole('heading', { name: article.title })).toBeInTheDocument();
    expect(within(dialog).queryByTitle(article.title)).not.toBeInTheDocument();

    const outbound = within(dialog).getByRole('link', { name: /open article/i });
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

  it('swaps related content without closing and resets the scroll container to the top', () => {
    const item = launchpadContent[0];
    const related = getRelatedContent(launchpadContent, item);
    const onRelated = vi.fn();
    const { rerender } = renderPanel({ item, related, onRelated });
    const body = screen.getByTestId('learn-more-body');

    body.scrollTop = 320;
    fireEvent.click(screen.getByRole('button', { name: new RegExp(related[0].title, 'i') }));
    expect(onRelated).toHaveBeenCalledWith(related[0]);

    rerender(
      <LearnMorePanel
        item={related[0]}
        related={getRelatedContent(launchpadContent, related[0])}
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
