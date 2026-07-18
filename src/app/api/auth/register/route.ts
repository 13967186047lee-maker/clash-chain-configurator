import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSession, hashPassword, writeAudit } from '@/server/auth';
import { getDb } from '@/server/db';
import { users } from '@/server/db/schema';
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
  password: z.string().min(12).max(128),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: NextRequest) {
  try {
    validateRequestOrigin(request);
    enforceRateLimit(`register:${await getClientIpHash()}`, 5, 15 * 60_000);
    const input = schema.parse(await readJson(request));
    const db = getDb();
    const email = normalizeEmail(input.email);
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) throw new ApiError(409, '该邮箱已经注册');
    await consumeEmailCode(email, 'registration', input.code);
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: await hashPassword(input.password),
        emailVerifiedAt: new Date(),
        role: adminEmails.includes(email) ? 'admin' : 'user',
      })
      .returning();
    await writeAudit('auth.register', user.id, user.id);
    return createSession(user.id, request);
  } catch (error) {
    return apiError(error);
  }
}
