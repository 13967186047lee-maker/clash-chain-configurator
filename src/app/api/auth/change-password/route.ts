import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, requireUser, verifyPassword, writeAudit } from '@/server/auth';
import { getDb } from '@/server/db';
import { sessions, users } from '@/server/db/schema';
import { ApiError, apiError, readJson, validateCsrf } from '@/server/security';

const schema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128),
});
export async function POST(request: NextRequest) {
  try {
    validateCsrf(request);
    const current = await requireUser(request);
    const input = schema.parse(await readJson(request));
    if (!(await verifyPassword(current.user.passwordHash, input.currentPassword)))
      throw new ApiError(401, '当前密码错误');
    const db = getDb();
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(input.newPassword) })
      .where(eq(users.id, current.user.id));
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.userId, current.user.id));
    await writeAudit('auth.password_changed', current.user.id, current.user.id);
    return NextResponse.json({ ok: true, reauthenticate: true });
  } catch (error) {
    return apiError(error);
  }
}
