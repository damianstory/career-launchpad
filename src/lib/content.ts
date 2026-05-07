import type { ContentFilters, LaunchpadContent } from '@/types';

export function applyContentFilters(
  content: LaunchpadContent[],
  filters: ContentFilters
): LaunchpadContent[] {
  if (!filters.category && !filters.format) return content;

  return content.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.format && item.format !== filters.format) return false;
    return true;
  });
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
    return embedMatch?.[1] ?? null;
  } catch {
    return null;
  }
}
