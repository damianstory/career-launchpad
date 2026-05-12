import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

import { revalidateLaunchpadContent } from '@/lib/revalidate-launchpad-content';

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.LAUNCHPAD_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'misconfigured' }, { status: 500 });
  }

  const header = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await revalidateLaunchpadContent();
  return NextResponse.json({ ok: true });
}
