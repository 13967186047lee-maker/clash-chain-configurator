import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, requireUser, writeAudit } from '@/server/auth';
import { getDb } from '@/server/db';
import { sessions } from '@/server/db/schema';
import { apiError, validateCsrf } from '@/server/security';

export async function POST(request: NextRequest) {
  try {
    validateCsrf(request);
    const current = await requireUser(request);
    await getDb()
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, current.session.id));
    await writeAudit('auth.logout', current.user.id, current.user.id);
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete('csrf-token');
    return response;
  } catch (error) {
    return apiError(error);
  }
}
