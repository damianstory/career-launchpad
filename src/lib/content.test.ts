import { describe, expect, it } from 'vitest';
import type { LaunchpadContent } from '@/types';
import { fixtureContent } from '@/test/fixtures/content';

import {
  applyContentFilters,
  getContentBySlug,
  getRelatedContent,
  getVideoSource,
  getYouTubeId,
  shuffleContentForVisit,
} from './content';

describe('content filtering', () => {
  it('filters by category and format without mutating the source list', () => {
    const result = applyContentFilters(fixtureContent, {
      categories: ['life-skills'],
      format: 'video',
    });

    expect(result).toHaveLength(1);
    expect(result.every((item) => item.categories.includes('life-skills'))).toBe(true);
    expect(result.every((item) => item.format === 'video')).toBe(true);
    expect(fixtureContent).toHaveLength(5);
  });

  it('returns all content when filters are empty', () => {
    expect(applyContentFilters(fixtureContent, { categories: [], format: null })).toEqual(fixtureContent);
  });

  it('keeps multi-category filters as OR unions', () => {
    const content: LaunchpadContent[] = [
      { ...fixtureContent[0], id: 'skills-on-job', categories: ['skills-canada', 'on-the-job'] },
      { ...fixtureContent[1], id: 'mindset-only', categories: ['mindsets'], primaryCategory: 'mindsets' },
      { ...fixtureContent[2], id: 'how-i-got-here-only', categories: ['how-i-got-here'] },
    ];

    const result = applyContentFilters(content, {
      categories: ['skills-canada', 'mindsets'],
      format: null,
    });

    expect(result.map((item) => item.id)).toEqual(['skills-on-job', 'mindset-only']);
  });

  it('preserves matching item order', () => {
    const content: LaunchpadContent[] = [
      { ...fixtureContent[1], id: 'first-match', categories: ['mindsets'], primaryCategory: 'mindsets' },
      { ...fixtureContent[0], id: 'non-match', categories: ['life-skills'], primaryCategory: 'life-skills' },
      { ...fixtureContent[4], id: 'second-match', categories: ['mindsets'], primaryCategory: 'mindsets' },
    ];

    const result = applyContentFilters(content, {
      categories: ['mindsets'],
      format: null,
    });

    expect(result.map((item) => item.id)).toEqual(['first-match', 'second-match']);
  });
});

describe('visit shuffle', () => {
  it('returns the same order for the same seed', () => {
    expect(shuffleContentForVisit(fixtureContent, 'seed-1').map((item) => item.slug)).toEqual([
      'article-empty-learn-more',
      'first-internship-real-talk',
      'nonlinear-career-path',
      'future-proof-skills',
      'ai-tools-student-workflow',
    ]);
  });

  it('returns different fixture-derived orders for different seeds', () => {
    expect(shuffleContentForVisit(fixtureContent, 'seed-2').map((item) => item.slug)).toEqual([
      'future-proof-skills',
      'ai-tools-student-workflow',
      'nonlinear-career-path',
      'first-internship-real-talk',
      'article-empty-learn-more',
    ]);
  });

  it('does not mutate the source list', () => {
    const source = [...fixtureContent];

    shuffleContentForVisit(source, 'seed-1');

    expect(source).toEqual(fixtureContent);
  });

  it('returns an empty array for empty input', () => {
    expect(shuffleContentForVisit([], 'seed-1')).toEqual([]);
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

describe('video source parsing', () => {
  it('detects Gumlet embed URLs from pasted embed codes', () => {
    expect(
      getVideoSource(
        'https://play.gumlet.io/embed/6a106a3589ec653eb39ce727?background=false&autoplay=false&loop=false&disable_player_controls=false'
      )
    ).toEqual({
      provider: 'gumlet',
      id: '6a106a3589ec653eb39ce727',
    });
  });

  it('still detects YouTube URLs', () => {
    expect(getVideoSource('https://www.youtube.com/watch?v=abc123')).toEqual({
      provider: 'youtube',
      id: 'abc123',
    });
  });
});
