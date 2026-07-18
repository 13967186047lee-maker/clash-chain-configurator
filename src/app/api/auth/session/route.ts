import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/auth';
import { apiError, randomToken } from '@/server/security';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ authenticated: false });
    const csrfToken = request.cookies.get('csrf-token')?.value || randomToken(24);
    const response = NextResponse.json({
      authenticated: true,
      csrfToken,
      user: { id: session.user.id, email: session.user.email, role: session.user.role },
    });
    if (!request.cookies.get('csrf-token'))
      response.cookies.set('csrf-token', csrfToken, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
    return response;
  } catch (error) {
    return apiError(error);
  }
}
