import { describe, expect, it } from 'vitest';
import { applyContentFilters, getContentBySlug, getRelatedContent } from './content';
import { launchpadContent } from '@/data/content';

describe('content filtering', () => {
  it('filters by category and format without mutating the source list', () => {
    const result = applyContentFilters(launchpadContent, {
      category: 'life-skills',
      format: 'playbook',
    });

    expect(result).toHaveLength(3);
    expect(result.every((item) => item.category === 'life-skills')).toBe(true);
    expect(result.every((item) => item.format === 'playbook')).toBe(true);
    expect(launchpadContent).toHaveLength(16);
  });

  it('returns all content when filters are empty', () => {
    expect(applyContentFilters(launchpadContent, { category: null, format: null })).toEqual(launchpadContent);
  });
});

describe('content lookup', () => {
  it('finds content by slug', () => {
    const item = getContentBySlug(launchpadContent, 'cold-email-playbook');

    expect(item?.title).toBe('How to Write a Cold Email That Gets a Reply');
  });

  it('resolves related content in declared order', () => {
    const item = getContentBySlug(launchpadContent, 'ai-tools-student-workflow');
    const related = getRelatedContent(launchpadContent, item);

    expect(related.map((entry) => entry.slug)).toEqual([
      'cold-email-playbook',
      'future-proof-skills',
    ]);
  });
});
