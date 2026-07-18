import { and, eq, ne } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, writeAudit } from '@/server/auth';
import { getDb } from '@/server/db';
import { devices, sessions, users } from '@/server/db/schema';
import { ApiError, apiError, readJson, validateCsrf } from '@/server/security';

const schema = z.object({ status: z.enum(['active', 'disabled']) });
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    validateCsrf(request);
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    if (id === admin.user.id) throw new ApiError(400, '不能修改自己的状态');
    const { status } = schema.parse(await readJson(request));
    const db = getDb();
    await db.update(users).set({ status }).where(eq(users.id, id));
    if (status === 'disabled') {
      await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, id));
      await db.update(devices).set({ revokedAt: new Date() }).where(eq(devices.userId, id));
    }
    await writeAudit(`admin.user_${status}`, admin.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    validateCsrf(request);
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    if (id === admin.user.id) throw new ApiError(400, '不能删除自己的账号');
    await writeAudit('admin.user_deleted', admin.user.id, id);
    await getDb()
      .delete(users)
      .where(and(eq(users.id, id), ne(users.role, 'admin')));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
