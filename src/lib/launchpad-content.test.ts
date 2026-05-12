import { describe, expect, it } from 'vitest';

import { normalizeLaunchpadContent } from './launchpad-content-normalize';

const categories = [
  { slug: 'emerging-careers', name: 'Emerging Careers', display_order: 1 },
  { slug: 'day-in-the-life', name: 'On the Job', display_order: 2 },
  { slug: 'life-skills', name: 'Life Skills', display_order: 3 },
  { slug: 'unknown-category', name: 'Unknown', display_order: 4 },
];

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'content-1',
    slug: 'sample',
    title: 'Sample',
    description: 'Sample description',
    content_type: 'video',
    thumbnail_url: 'https://img.youtube.com/vi/example/maxresdefault.jpg',
    video_url: 'https://www.youtube.com/shorts/example',
    video_orientation: 'vertical',
    video_duration: 60,
    article_embed_url: null,
    article_source_name: null,
    article_content: null,
    playbook_content: null,
    reading_time_minutes: null,
    related_playbook_id: null,
    published_at: '2026-01-01T00:00:00.000Z',
    why_it_matters: 'Why it matters',
    planning_connection: 'Planning connection',
    takeaway: 'Takeaway',
    content_categories: [
      { categories: { slug: 'life-skills', name: 'Life Skills', display_order: 3 } },
      { categories: { slug: 'day-in-the-life', name: 'On the Job', display_order: 2 } },
    ],
    ...overrides,
  };
}

describe('normalizeLaunchpadContent', () => {
  it('keeps all known categories, remaps legacy slugs, and chooses primary by display order', () => {
    const result = normalizeLaunchpadContent([row()] as never, categories as never);

    expect(result.categories.map((category) => category.slug)).toEqual([
      'emerging-careers',
      'on-the-job',
      'life-skills',
    ]);
    expect(result.items[0]).toMatchObject({
      categories: ['on-the-job', 'life-skills'],
      primaryCategory: 'on-the-job',
      format: 'video',
      mediaUrl: 'https://www.youtube.com/shorts/example',
      durationSeconds: 60,
      videoOrientation: 'vertical',
      publishedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('keeps Skills Canada in categories but prefers the permanent category as primary', () => {
    const result = normalizeLaunchpadContent(
      [
        row({
          content_categories: [
            { categories: { slug: 'skills-canada', name: 'Skills Canada', display_order: 0 } },
            { categories: { slug: 'on-the-job', name: 'On the Job', display_order: 2 } },
          ],
        }),
      ] as never,
      [
        { slug: 'skills-canada', name: 'Skills Canada', display_order: 0 },
        { slug: 'on-the-job', name: 'On the Job', display_order: 2 },
      ] as never
    );

    expect(result.items[0]).toMatchObject({
      categories: ['skills-canada', 'on-the-job'],
      primaryCategory: 'on-the-job',
    });
  });

  it('uses Skills Canada as primary when it is the only category', () => {
    const result = normalizeLaunchpadContent(
      [
        row({
          content_categories: [{ categories: { slug: 'skills-canada', name: 'Skills Canada', display_order: 0 } }],
        }),
      ] as never,
      [{ slug: 'skills-canada', name: 'Skills Canada', display_order: 0 }] as never
    );

    expect(result.items[0]).toMatchObject({
      categories: ['skills-canada'],
      primaryCategory: 'skills-canada',
    });
  });

  it('excludes playbooks, article-content-only rows, and rows with no known categories', () => {
    const result = normalizeLaunchpadContent(
      [
        row({ id: 'playbook', content_type: 'playbook', playbook_content: '# Steps' }),
        row({ id: 'mdx-article', content_type: 'article', article_embed_url: null, article_content: '# Article' }),
        row({
          id: 'unknown-category',
          content_categories: [{ categories: { slug: 'unknown-category', name: 'Unknown', display_order: 4 } }],
        }),
        row({ id: 'empty-category', content_categories: [] }),
      ] as never,
      categories as never
    );

    expect(result.items).toHaveLength(0);
  });

  it('maps external article and optional Learn More fields', () => {
    const result = normalizeLaunchpadContent(
      [
        row({
          content_type: 'article',
          thumbnail_url: '',
          video_url: null,
          video_orientation: null,
          video_duration: null,
          article_embed_url: 'https://example.com/article',
          article_source_name: 'Example',
          reading_time_minutes: 7,
          related_playbook_id: 'related-id',
          why_it_matters: null,
          planning_connection: null,
          takeaway: null,
        }),
      ] as never,
      categories as never
    );

    expect(result.items[0]).toMatchObject({
      format: 'article',
      thumbnailUrl: '/images/article-placeholder.svg',
      articleUrl: 'https://example.com/article',
      articleSourceName: 'Example',
      readingTimeMinutes: 7,
      learnMore: { relatedContentIds: ['related-id'] },
    });
    expect(result.items[0].learnMore.whyItMatters).toBeUndefined();
  });
});
