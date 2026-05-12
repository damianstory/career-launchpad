import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/revalidate-launchpad-content', () => ({
  revalidateLaunchpadContent: vi.fn(async () => {}),
}));

import { revalidateLaunchpadContent } from '@/lib/revalidate-launchpad-content';
import { POST } from './route';

const URL = 'http://localhost/api/revalidate-launchpad-content';
const SECRET = 'test-secret-value';

describe('POST /api/revalidate-launchpad-content', () => {
  beforeEach(() => {
    process.env.LAUNCHPAD_REVALIDATE_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.LAUNCHPAD_REVALIDATE_SECRET;
    vi.mocked(revalidateLaunchpadContent).mockClear();
  });

  it('returns 500 when the secret env var is unset', async () => {
    delete process.env.LAUNCHPAD_REVALIDATE_SECRET;
    const res = await POST(new Request(URL, { method: 'POST' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: 'misconfigured' });
    expect(revalidateLaunchpadContent).not.toHaveBeenCalled();
  });

  it('returns 401 when no Authorization header is sent', async () => {
    const res = await POST(new Request(URL, { method: 'POST' }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false });
    expect(revalidateLaunchpadContent).not.toHaveBeenCalled();
  });

  it('returns 401 when the bearer secret does not match', async () => {
    const res = await POST(
      new Request(URL, {
        method: 'POST',
        headers: { Authorization: 'Bearer wrong-secret' },
      }),
    );
    expect(res.status).toBe(401);
    expect(revalidateLaunchpadContent).not.toHaveBeenCalled();
  });

  it('returns 401 when the header has the right prefix but wrong length', async () => {
    const res = await POST(
      new Request(URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SECRET}-extra` },
      }),
    );
    expect(res.status).toBe(401);
    expect(revalidateLaunchpadContent).not.toHaveBeenCalled();
  });

  it('revalidates and returns 200 when the bearer secret matches', async () => {
    const res = await POST(
      new Request(URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${SECRET}` },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(revalidateLaunchpadContent).toHaveBeenCalledTimes(1);
  });
});
