import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, writeAudit } from '@/server/auth';
import { getDb } from '@/server/db';
import { sessions, users } from '@/server/db/schema';
import { consumeEmailCode, normalizeEmail } from '@/server/email';
import {
  ApiError,
  apiError,
  enforceRateLimit,
  getClientIpHash,
  readJson,
  validateRequestOrigin,
} from '@/server/security';

const schema = z.object({
  email: z.email().max(254),
  code: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(12).max(128),
});

export async function POST(request: NextRequest) {
  try {
    validateRequestOrigin(request);
    enforceRateLimit(`password-reset:${await getClientIpHash()}`, 10, 60 * 60_000);
    const input = schema.parse(await readJson(request));
    const email = normalizeEmail(input.email);
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw new ApiError(400, '验证码无效或已过期');
    await consumeEmailCode(email, 'password_reset', input.code);
    await db
      .update(users)
      .set({
        passwordHash: await hashPassword(input.newPassword),
        emailVerifiedAt: user.emailVerifiedAt || new Date(),
      })
      .where(eq(users.id, user.id));
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, user.id));
    await writeAudit('auth.password_reset', user.id, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
