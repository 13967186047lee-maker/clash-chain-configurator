import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/server/db';
import { publishedSubscriptions } from '@/server/db/schema';
import { apiError, enforceRateLimit, getClientIpHash, hashToken } from '@/server/security';

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  try {
    enforceRateLimit(`public-subscription:${await getClientIpHash()}`, 120, 60_000);
    const { token } = await context.params;
    if (!/^[A-Za-z0-9_-]{40,64}$/.test(token))
      return new NextResponse('Not found', { status: 404 });
    const [subscription] = await getDb()
      .select({ content: publishedSubscriptions.yamlContent })
      .from(publishedSubscriptions)
      .where(eq(publishedSubscriptions.tokenHash, hashToken(token)))
      .limit(1);
    if (!subscription) return new NextResponse('Not found', { status: 404 });
    return new NextResponse(subscription.content, {
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
        'Content-Disposition': 'inline; filename="clash-config.yaml"',
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
