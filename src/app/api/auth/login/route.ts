import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSession, verifyPassword, writeAudit } from '@/server/auth';
import { getDb } from '@/server/db';
import { users } from '@/server/db/schema';
import {
  ApiError,
  apiError,
  enforceRateLimit,
  getClientIpHash,
  readJson,
  validateRequestOrigin,
} from '@/server/security';

const schema = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) });

export async function POST(request: NextRequest) {
  try {
    validateRequestOrigin(request);
    enforceRateLimit(`login:${await getClientIpHash()}`, 10, 15 * 60_000);
    const input = schema.parse(await readJson(request));
    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email.trim().toLowerCase()))
      .limit(1);
    if (!user || !(await verifyPassword(user.passwordHash, input.password)))
      throw new ApiError(401, '邮箱或密码错误');
    if (user.status !== 'active') throw new ApiError(403, '账号已被禁用');
    if (!user.emailVerifiedAt) throw new ApiError(403, '请先验证邮箱');
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await writeAudit('auth.login', user.id, user.id);
    return createSession(user.id, request);
  } catch (error) {
    return apiError(error);
  }
}
