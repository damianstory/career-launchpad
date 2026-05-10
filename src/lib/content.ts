import type { CategorySlug, ContentFilters, ContentFormat, LaunchpadContent } from '@/types';

export function applyContentFilters(
  content: LaunchpadContent[],
  filters: ContentFilters
): LaunchpadContent[] {
  if (filters.categories.length === 0 && !filters.format) return content;

  return content.filter((item) => {
    if (filters.categories.length > 0 && !filters.categories.some((slug) => item.categories.includes(slug))) return false;
    if (filters.format && item.format !== filters.format) return false;
    return true;
  });
}

export function orderContentForFeed(
  content: LaunchpadContent[],
  filters: ContentFilters
): LaunchpadContent[] {
  if (filters.format) return content;

  const videos = content.filter((item) => item.format === 'video');
  const nonVideos = content.filter((item) => item.format !== 'video');
  return [...videos, ...nonVideos];
}

export function getContentBySlug(
  content: LaunchpadContent[],
  slug: string | null
): LaunchpadContent | undefined {
  if (!slug) return undefined;
  return content.find((item) => item.slug === slug);
}

export function getRelatedContent(
  content: LaunchpadContent[],
  item: LaunchpadContent | undefined
): LaunchpadContent[] {
  if (!item) return [];

  const byId = new Map(content.map((entry) => [entry.id, entry]));
  return item.learnMore.relatedContentIds
    .map((id) => byId.get(id))
    .filter((entry): entry is LaunchpadContent => Boolean(entry));
}

export function formatDuration(seconds: number | undefined): string | null {
  if (!seconds) return null;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function getYouTubeId(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1);
    if (parsed.searchParams.has('v')) return parsed.searchParams.get('v');
    const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
    const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch?.[1]) return shortsMatch[1];
    return embedMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Count content items matching a category slug (or all categories if null),
 * optionally cross-filtered by format. Used by BrowseDrawer path cards.
 */
export function countContentByCategory(
  slug: CategorySlug | null,
  format: ContentFormat | null,
  content: LaunchpadContent[]
): number {
  return content.filter((item) => {
    if (slug !== null && !item.categories.includes(slug)) return false;
    if (format !== null && item.format !== format) return false;
    return true;
  }).length;
}

/**
 * Count content items matching a format (or all formats if null),
 * optionally cross-filtered by an array of category slugs. Used by BrowseDrawer format cards.
 */
export function countContentByFormat(
  format: ContentFormat | null,
  categories: CategorySlug[],
  content: LaunchpadContent[]
): number {
  return content.filter((item) => {
    if (format !== null && item.format !== format) return false;
    if (categories.length > 0 && !categories.some((slug) => item.categories.includes(slug))) return false;
    return true;
  }).length;
}
