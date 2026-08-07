import { connection } from 'next/server';
import { Suspense } from 'react';

import { LaunchpadApp } from '@/components/LaunchpadApp';
import { getLaunchpadContent } from '@/lib/launchpad-content';

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ content?: string | string[]; panel?: string | string[]; path?: string | string[] }>;
}) {
  return (
    <Suspense fallback={null}>
      <LaunchpadPage searchParams={searchParams} />
    </Suspense>
  );
}

async function LaunchpadPage({
  searchParams,
}: {
  searchParams: Promise<{ content?: string | string[]; panel?: string | string[]; path?: string | string[] }>;
}) {
  await connection();

  const params = await searchParams;
  const initialContentSlug = Array.isArray(params.content) ? params.content[0] : params.content;
  const panelParam = Array.isArray(params.panel) ? params.panel[0] : params.panel;
  const pathParam = Array.isArray(params.path) ? params.path[0] : params.path;
  const { items, categories } = await getLaunchpadContent();
  const feedSeed = crypto.randomUUID();

  return (
    <LaunchpadApp
      initialContent={items}
      initialCategories={categories}
      initialContentSlug={initialContentSlug ?? null}
      initialPanel={panelParam === 'info' ? 'info' : null}
      initialPathSlug={pathParam ?? null}
      feedSeed={feedSeed}
    />
  );
}
