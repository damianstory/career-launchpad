import type { CategorySlug, LaunchpadCategory, LaunchpadContent } from '@/types';

const PLACEHOLDER_THUMBNAIL = '/images/article-placeholder.svg';
const KNOWN_CATEGORY_SLUGS: CategorySlug[] = [
  'emerging-careers',
  'on-the-job',
  'life-skills',
  'mindsets',
  'how-i-got-here',
  'problems-to-solve',
  'post-secondary',
  'skilled-trades',
];

export type DbCategory = {
  slug: string;
  name: string;
  display_order: number;
};

export type DbContentCategory = {
  categories: DbCategory | DbCategory[] | null;
};

export type DbContent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content_type: string;
  thumbnail_url: string | null;
  video_url: string | null;
  video_orientation: 'vertical' | 'horizontal' | null;
  video_duration: number | null;
  article_embed_url: string | null;
  article_source_name: string | null;
  article_content: string | null;
  playbook_content: string | null;
  reading_time_minutes: number | null;
  related_playbook_id: string | null;
  published_at: string;
  why_it_matters?: string | null;
  planning_connection?: string | null;
  takeaway?: string | null;
  reflection?: string | null;
  content_categories?: DbContentCategory[] | null;
};

export type LaunchpadContentResult = {
  items: LaunchpadContent[];
  categories: LaunchpadCategory[];
};

export function normalizeLaunchpadContent(rows: DbContent[], rawCategories: DbCategory[]): LaunchpadContentResult {
  const categoryBySlug = buildKnownCategories(rawCategories);
  const categories = [...categoryBySlug.values()].sort((a, b) => a.displayOrder - b.displayOrder);

  const items = rows
    .map((row) => normalizeContentRow(row, categoryBySlug))
    .filter((item): item is LaunchpadContent => Boolean(item));

  return { items, categories };
}

function normalizeContentRow(
  row: DbContent,
  categoryBySlug: Map<CategorySlug, LaunchpadCategory>
): LaunchpadContent | null {
  // The DB can still hold legacy or future content types; only supported formats reach the feed.
  const format = row.content_type;
  if (format !== 'video' && format !== 'article') return null;
  if (format === 'article' && !row.article_embed_url) return null;

  const categories = flattenCategories(row.content_categories ?? [], categoryBySlug);
  if (categories.length === 0) return null;

  // While the DB still uses the legacy 'skills-canada' slug, that tag stays
  // secondary (topical categories win primary). Once the DB row is renamed to
  // 'skilled-trades' it competes normally by display order.
  const hasLegacyEventTag = hasRawCategorySlug(row.content_categories ?? [], 'skills-canada');
  const primaryEligible = hasLegacyEventTag
    ? categories.filter((slug) => slug !== 'skilled-trades')
    : categories;
  const primaryCategoryPool = primaryEligible.length > 0 ? primaryEligible : categories;
  const primaryCategory = [...primaryCategoryPool].sort(
    (a, b) => categoryBySlug.get(a)!.displayOrder - categoryBySlug.get(b)!.displayOrder
  )[0];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    categories,
    primaryCategory,
    format,
    thumbnailUrl: row.thumbnail_url || PLACEHOLDER_THUMBNAIL,
    publishedAt: row.published_at,
    mediaUrl: row.video_url || undefined,
    articleUrl: row.article_embed_url || undefined,
    articleSourceName: row.article_source_name || undefined,
    durationSeconds: row.video_duration || undefined,
    videoOrientation: row.video_orientation || undefined,
    readingTimeMinutes: row.reading_time_minutes || undefined,
    learnMore: {
      whyItMatters: row.why_it_matters || undefined,
      planningConnection: row.planning_connection || undefined,
      takeaway: row.takeaway || undefined,
      reflection: row.reflection ?? '',
      relatedContentIds: row.related_playbook_id ? [row.related_playbook_id] : [],
    },
  };
}

function buildKnownCategories(rawCategories: DbCategory[]): Map<CategorySlug, LaunchpadCategory> {
  const categories = new Map<CategorySlug, LaunchpadCategory>();

  for (const category of rawCategories) {
    const slug = normalizeKnownCategory(category.slug);
    if (!slug || categories.has(slug)) continue;

    categories.set(slug, {
      slug,
      name: category.name,
      displayOrder: category.display_order,
    });
  }

  return categories;
}

function flattenCategories(
  contentCategories: DbContentCategory[],
  categoryBySlug: Map<CategorySlug, LaunchpadCategory>
): CategorySlug[] {
  const slugs: CategorySlug[] = [];

  for (const entry of contentCategories) {
    const nested = Array.isArray(entry.categories) ? entry.categories : [entry.categories];
    for (const category of nested) {
      const slug = normalizeKnownCategory(category?.slug);
      if (slug && categoryBySlug.has(slug) && !slugs.includes(slug)) {
        slugs.push(slug);
      }
    }
  }

  return slugs.sort((a, b) => categoryBySlug.get(a)!.displayOrder - categoryBySlug.get(b)!.displayOrder);
}

function hasRawCategorySlug(contentCategories: DbContentCategory[], rawSlug: string): boolean {
  return contentCategories.some((entry) => {
    const nested = Array.isArray(entry.categories) ? entry.categories : [entry.categories];
    return nested.some((category) => category?.slug === rawSlug);
  });
}

const LEGACY_CATEGORY_ALIASES: Record<string, CategorySlug> = {
  'day-in-the-life': 'on-the-job',
  'skills-canada': 'skilled-trades',
};

export function normalizeKnownCategory(slug: string | undefined): CategorySlug | null {
  if (!slug) return null;
  const normalized = LEGACY_CATEGORY_ALIASES[slug] ?? slug;
  return KNOWN_CATEGORY_SLUGS.includes(normalized as CategorySlug) ? (normalized as CategorySlug) : null;
}
