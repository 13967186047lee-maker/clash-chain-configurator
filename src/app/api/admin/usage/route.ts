import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth';
import { getDb } from '@/server/db';
import { encryptedDocuments, users } from '@/server/db/schema';
import { apiError } from '@/server/security';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = getDb();
    const [userStats] = await db
      .select({
        totalUsers: sql<number>`count(*)`,
        activeUsers: sql<number>`count(*) filter (where ${users.status} = 'active')`,
      })
      .from(users);
    const [storage] = await db
      .select({ totalStorageBytes: sql<number>`coalesce(sum(${encryptedDocuments.sizeBytes}), 0)` })
      .from(encryptedDocuments);
    return NextResponse.json({ ...userStats, ...storage });
  } catch (error) {
    return apiError(error);
  }
}
