import { describe, expect, it } from 'vitest';
import type { LaunchpadContent } from '@/types';
import { fixtureContent } from '@/test/fixtures/content';

import {
  applyContentFilters,
  getContentBySlug,
  getRelatedContent,
  getYouTubeId,
  orderContentForFeed,
} from './content';

describe('content filtering', () => {
  it('filters by category and format without mutating the source list', () => {
    const result = applyContentFilters(fixtureContent, {
      category: 'life-skills',
      format: 'video',
    });

    expect(result).toHaveLength(1);
    expect(result.every((item) => item.categories.includes('life-skills'))).toBe(true);
    expect(result.every((item) => item.format === 'video')).toBe(true);
    expect(fixtureContent).toHaveLength(5);
  });

  it('returns all content when filters are empty', () => {
    expect(applyContentFilters(fixtureContent, { category: null, format: null })).toEqual(fixtureContent);
  });
});

describe('feed ordering', () => {
  it('promotes videos first when no format filter is selected', () => {
    const articleFirst = [fixtureContent[1], fixtureContent[0], fixtureContent[3], fixtureContent[2]];

    const result = orderContentForFeed(articleFirst, { category: null, format: null });

    expect(result.map((item) => item.slug)).toEqual([
      'ai-tools-student-workflow',
      'nonlinear-career-path',
      'future-proof-skills',
      'first-internship-real-talk',
    ]);
  });

  it('keeps videos first inside a category when no format filter is selected', () => {
    const categoryContent: LaunchpadContent[] = [
      {
        ...fixtureContent[1],
        id: 'article-life-skills',
        slug: 'article-life-skills',
        categories: ['life-skills'],
        primaryCategory: 'life-skills',
      },
      fixtureContent[0],
      {
        ...fixtureContent[3],
        id: 'article-life-skills-2',
        slug: 'article-life-skills-2',
        categories: ['life-skills'],
        primaryCategory: 'life-skills',
      },
    ];

    const filtered = applyContentFilters(categoryContent, { category: 'life-skills', format: null });
    const result = orderContentForFeed(filtered, { category: 'life-skills', format: null });

    expect(result.map((item) => item.format)).toEqual(['video', 'article', 'article']);
  });

  it('preserves explicit format-filter order', () => {
    const articleFirst = [fixtureContent[1], fixtureContent[0], fixtureContent[3], fixtureContent[2]];

    expect(orderContentForFeed(articleFirst, { category: null, format: 'video' })).toEqual(articleFirst);
  });
});

describe('content lookup', () => {
  it('finds content by slug', () => {
    const item = getContentBySlug(fixtureContent, 'first-internship-real-talk');

    expect(item?.title).toBe('What Your First Internship Actually Teaches You');
  });

  it('resolves related content in declared order', () => {
    const item = getContentBySlug(fixtureContent, 'ai-tools-student-workflow');
    const related = getRelatedContent(fixtureContent, item);

    expect(related.map((entry) => entry.slug)).toEqual(['first-internship-real-talk']);
  });
});

describe('YouTube URL parsing', () => {
  it('extracts ids from watch, short, youtu.be, and embed URLs', () => {
    expect(getYouTubeId('https://www.youtube.com/watch?v=abc123')).toBe('abc123');
    expect(getYouTubeId('https://www.youtube.com/shorts/short123')).toBe('short123');
    expect(getYouTubeId('https://youtu.be/shortlink123')).toBe('shortlink123');
    expect(getYouTubeId('https://www.youtube.com/embed/embed123')).toBe('embed123');
  });
});
