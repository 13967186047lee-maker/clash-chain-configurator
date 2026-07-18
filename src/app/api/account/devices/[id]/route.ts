import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser, writeAudit } from '@/server/auth';
import { getDb } from '@/server/db';
import { devices, sessions } from '@/server/db/schema';
import { apiError, validateCsrf } from '@/server/security';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    validateCsrf(request);
    const current = await requireUser(request);
    const { id } = await context.params;
    const db = getDb();
    await db
      .update(devices)
      .set({ revokedAt: new Date() })
      .where(and(eq(devices.id, id), eq(devices.userId, current.user.id)));
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.deviceId, id), eq(sessions.userId, current.user.id)));
    await writeAudit('device.revoked', current.user.id, current.user.id, { deviceId: id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
