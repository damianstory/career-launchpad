import { connection } from 'next/server';
import { Suspense } from 'react';

import { LaunchpadApp } from '@/components/LaunchpadApp';
import { getLaunchpadContent } from '@/lib/launchpad-content';

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ content?: string | string[] }>;
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
  searchParams: Promise<{ content?: string | string[] }>;
}) {
  await connection();

  const params = await searchParams;
  const initialContentSlug = Array.isArray(params.content) ? params.content[0] : params.content;
  const { items, categories } = await getLaunchpadContent();

  return (
    <LaunchpadApp
      initialContent={items}
      initialCategories={categories}
      initialContentSlug={initialContentSlug ?? null}
    />
  );
}
