import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/server/db';
import { users } from '@/server/db/schema';
import { issueEmailCode, normalizeEmail } from '@/server/email';
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
  purpose: z.enum(['registration', 'password_reset']),
});

export async function POST(request: NextRequest) {
  try {
    validateRequestOrigin(request);
    const input = schema.parse(await readJson(request));
    const email = normalizeEmail(input.email);
    const ipHash = await getClientIpHash();
    enforceRateLimit(`email-code-ip:${ipHash}`, 10, 60 * 60_000);
    enforceRateLimit(`email-code:${input.purpose}:${email}`, 3, 15 * 60_000);
    const [user] = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (input.purpose === 'registration' && user) throw new ApiError(409, '该邮箱已经注册');
    if (input.purpose === 'password_reset' && !user) return NextResponse.json({ ok: true });
    await issueEmailCode(email, input.purpose);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
