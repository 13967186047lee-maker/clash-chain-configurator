import { desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth';
import { getDb } from '@/server/db';
import { auditLogs } from '@/server/db/schema';
import { apiError } from '@/server/security';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const rows = await getDb()
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        actorUserId: auditLogs.actorUserId,
        targetUserId: auditLogs.targetUserId,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(200);
    return NextResponse.json({ auditLogs: rows });
  } catch (error) {
    return apiError(error);
  }
}
