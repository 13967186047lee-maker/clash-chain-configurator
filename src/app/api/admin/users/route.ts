import { desc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth';
import { getDb } from '@/server/db';
import { devices, encryptedDocuments, users } from '@/server/db/schema';
import { apiError } from '@/server/security';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const rows = await getDb()
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        quotaBytes: users.quotaBytes,
        storageBytes: sql<number>`coalesce(max(${encryptedDocuments.sizeBytes}), 0)`,
        deviceCount: sql<number>`count(distinct ${devices.id})`,
      })
      .from(users)
      .leftJoin(encryptedDocuments, eq(users.id, encryptedDocuments.userId))
      .leftJoin(devices, eq(users.id, devices.userId))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(200);
    return NextResponse.json({
      users: rows.map((row) => ({ ...row, email: maskEmail(row.email) })),
    });
  } catch (error) {
    return apiError(error);
  }
}

function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
}
