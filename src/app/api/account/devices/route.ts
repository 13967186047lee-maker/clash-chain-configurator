import { and, eq, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/server/auth';
import { getDb } from '@/server/db';
import { devices } from '@/server/db/schema';
import { apiError } from '@/server/security';

export async function GET(request: NextRequest) {
  try {
    const current = await requireUser(request);
    const rows = await getDb()
      .select({
        id: devices.id,
        name: devices.name,
        lastActiveAt: devices.lastActiveAt,
        createdAt: devices.createdAt,
      })
      .from(devices)
      .where(and(eq(devices.userId, current.user.id), isNull(devices.revokedAt)));
    return NextResponse.json({ devices: rows });
  } catch (error) {
    return apiError(error);
  }
}
