import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';

import {
  normalizeLaunchpadContent,
  type DbCategory,
  type DbContent,
  type LaunchpadContentResult,
} from '@/lib/launchpad-content-normalize';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const CONTENT_SELECT = `
  id, slug, title, description, content_type, thumbnail_url,
  video_url, video_orientation, video_duration,
  article_embed_url, article_source_name, article_content,
  playbook_content, reading_time_minutes,
  related_playbook_id, published_at, why_it_matters,
  planning_connection, takeaway, reflection,
  content_categories ( categories ( slug, name, display_order ) )
`;

const CONTENT_SELECT_WITHOUT_LAUNCHPAD_COLUMNS = `
  id, slug, title, description, content_type, thumbnail_url,
  video_url, video_orientation, video_duration,
  article_embed_url, article_source_name, article_content,
  playbook_content, reading_time_minutes,
  related_playbook_id, published_at,
  content_categories ( categories ( slug, name, display_order ) )
`;

export async function getLaunchpadContent(): Promise<LaunchpadContentResult> {
  'use cache';
  cacheTag('launchpad-content');
  cacheLife({ revalidate: 300 });

  const supabase = getSupabaseServerClient();

  const [contentResult, categoriesResult] = await Promise.all([
    fetchContentRows(CONTENT_SELECT),
    supabase.from('categories').select('slug, name, display_order').order('display_order', { ascending: true }),
  ]);

  let contentData = contentResult.data;
  let contentError = contentResult.error;

  if (isMissingLaunchpadColumnError(contentError)) {
    const fallbackResult = await fetchContentRows(CONTENT_SELECT_WITHOUT_LAUNCHPAD_COLUMNS);
    contentData = fallbackResult.data;
    contentError = fallbackResult.error;
  }

  if (contentError) {
    throw new Error(`Failed to load launchpad content: ${contentError.message}`);
  }

  if (categoriesResult.error) {
    throw new Error(`Failed to load launchpad categories: ${categoriesResult.error.message}`);
  }

  return normalizeLaunchpadContent(
    ((contentData ?? []) as unknown as DbContent[]),
    ((categoriesResult.data ?? []) as unknown as DbCategory[])
  );
}

async function fetchContentRows(select: string) {
  const supabase = getSupabaseServerClient();

  return supabase
    .from('content')
    .select(select)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .order('id', { ascending: true });
}

function isMissingLaunchpadColumnError(error: { message?: string } | null): boolean {
  if (!error?.message) return false;
  return ['why_it_matters', 'planning_connection', 'takeaway'].some((column) =>
    error.message?.includes(column)
  );
}
