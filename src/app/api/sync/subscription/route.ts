import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, writeAudit } from '@/server/auth';
import { getDb } from '@/server/db';
import { publishedSubscriptions } from '@/server/db/schema';
import {
  apiError,
  enforceRateLimit,
  hashToken,
  randomToken,
  readJson,
  validateCsrf,
} from '@/server/security';
import { validatePublishedMihomoConfig } from '@/server/subscription';

const MAX_SUBSCRIPTION_BYTES = 1024 * 1024;
const publishSchema = z.object({
  content: z.string().min(1).max(MAX_SUBSCRIPTION_BYTES),
  acknowledged: z.literal(true),
});

export async function GET(request: NextRequest) {
  try {
    const current = await requireUser(request);
    const [subscription] = await getDb()
      .select({
        updatedAt: publishedSubscriptions.updatedAt,
        sizeBytes: publishedSubscriptions.sizeBytes,
      })
      .from(publishedSubscriptions)
      .where(eq(publishedSubscriptions.userId, current.user.id))
      .limit(1);
    return NextResponse.json({ published: !!subscription, subscription: subscription || null });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    validateCsrf(request);
    const current = await requireUser(request);
    enforceRateLimit(`subscription-publish:${current.user.id}`, 10, 60 * 60_000);
    const input = publishSchema.parse(await readJson(request, MAX_SUBSCRIPTION_BYTES + 4096));
    const sizeBytes = Buffer.byteLength(input.content, 'utf8');
    if (sizeBytes > MAX_SUBSCRIPTION_BYTES)
      return NextResponse.json({ error: '订阅配置不能超过 1 MB' }, { status: 413 });
    validatePublishedMihomoConfig(input.content);
    const token = randomToken(32);
    const db = getDb();
    const [existing] = await db
      .select({ id: publishedSubscriptions.id })
      .from(publishedSubscriptions)
      .where(eq(publishedSubscriptions.userId, current.user.id))
      .limit(1);
    const values = {
      tokenHash: hashToken(token),
      yamlContent: input.content,
      sizeBytes,
      updatedAt: new Date(),
    };
    if (existing)
      await db
        .update(publishedSubscriptions)
        .set(values)
        .where(eq(publishedSubscriptions.id, existing.id));
    else await db.insert(publishedSubscriptions).values({ ...values, userId: current.user.id });
    await writeAudit(
      existing ? 'subscription.rotated' : 'subscription.published',
      current.user.id,
      current.user.id,
      { sizeBytes },
    );
    return NextResponse.json({ ok: true, token, path: `/api/subscriptions/${token}` });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    validateCsrf(request);
    const current = await requireUser(request);
    await getDb()
      .delete(publishedSubscriptions)
      .where(eq(publishedSubscriptions.userId, current.user.id));
    await writeAudit('subscription.revoked', current.user.id, current.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
