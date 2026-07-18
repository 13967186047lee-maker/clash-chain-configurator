import { hash, verify } from '@node-rs/argon2';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from './db';
import { auditLogs, devices, sessions, users } from './db/schema';
import { ApiError, getClientIpHash, hashToken, randomToken } from './security';

export const SESSION_COOKIE = 'ccc-session';
export const CSRF_COOKIE = 'csrf-token';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const hashPassword = (password: string) =>
  hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 3, parallelism: 1, outputLen: 32 });
export const verifyPassword = (passwordHash: string, password: string) =>
  verify(passwordHash, password);

export async function createSession(userId: string, request: NextRequest) {
  const db = getDb();
  const token = randomToken();
  const csrf = randomToken(24);
  const userAgent = request.headers.get('user-agent')?.slice(0, 500) || null;
  const [device] = await db
    .insert(devices)
    .values({ userId, name: deviceName(userAgent), userAgent })
    .returning();
  await db.insert(sessions).values({
    userId,
    deviceId: device.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  const response = NextResponse.json({ ok: true, csrfToken: csrf });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
  response.cookies.set(CSRF_COOKIE, csrf, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
  return response;
}

function deviceName(userAgent: string | null) {
  if (!userAgent) return '未知设备';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : '浏览器';
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Mac OS/.test(userAgent)
      ? 'macOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /iPhone|iPad/.test(userAgent)
          ? 'iOS'
          : '设备';
  return `${browser} · ${os}`;
}

export async function getSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const [row] = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row || row.user.status !== 'active') return null;
  return row;
}

export async function requireUser(request: NextRequest) {
  const session = await getSession(request);
  if (!session) throw new ApiError(401, '请先登录');
  return session;
}

export async function requireAdmin(request: NextRequest) {
  const session = await requireUser(request);
  if (session.user.role !== 'admin') throw new ApiError(403, '需要管理员权限');
  return session;
}

export async function writeAudit(
  action: string,
  actorUserId?: string | null,
  targetUserId?: string | null,
  metadata: Record<string, unknown> = {},
) {
  await getDb()
    .insert(auditLogs)
    .values({ action, actorUserId, targetUserId, metadata, ipHash: await getClientIpHash() });
}
