import type { CategorySlug, ContentFilters, ContentFormat, LaunchpadContent } from '@/types';

export type VideoSource =
  | { provider: 'youtube'; id: string }
  | { provider: 'gumlet'; id: string };

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

export function shuffleContentForVisit<T>(content: T[], seed: string): T[] {
  const shuffled = [...content];
  const random = mulberry32(xmur3(seed)());

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function xmur3(value: string): () => number {
  let hash = 1779033703 ^ value.length;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
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
    const hostname = parsed.hostname.replace(/^www\./, '');
    const isYouTubeHost = hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'youtu.be';
    if (!isYouTubeHost) return null;

    if (hostname === 'youtu.be') return parsed.pathname.slice(1);
    if (parsed.searchParams.has('v')) return parsed.searchParams.get('v');
    const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/);
    const shortsMatch = parsed.pathname.match(/\/shorts\/([^/?]+)/);
    if (shortsMatch?.[1]) return shortsMatch[1];
    return embedMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getGumletId(url: string | undefined): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('gumlet.io')) return null;
    const embedMatch = parsed.pathname.match(/\/embed\/(?:live\/)?([^/?]+)/);
    return embedMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getVideoSource(url: string | undefined): VideoSource | null {
  const youtubeId = getYouTubeId(url);
  if (youtubeId) return { provider: 'youtube', id: youtubeId };

  const gumletId = getGumletId(url);
  if (gumletId) return { provider: 'gumlet', id: gumletId };

  return null;
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
