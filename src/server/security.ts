import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const buckets = new Map<string, { count: number; resetAt: number }>();

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function getClientIpHash() {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return hashToken(`${process.env.IP_HASH_SECRET || 'development'}:${ip}`);
}

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) throw new ApiError(429, '请求过于频繁，请稍后重试');
}

export function validateCsrf(request: NextRequest) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  validateRequestOrigin(request);
  const cookie = request.cookies.get('csrf-token')?.value;
  const header = request.headers.get('x-csrf-token');
  if (!cookie || !header || !safeEqual(cookie, header)) throw new ApiError(403, 'CSRF 校验失败');
}

export function validateRequestOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin) return;

  // Behind Caddy/Cloudflare, Next.js can see the container origin in
  // request.nextUrl. Prefer the explicitly configured public origin and
  // accept the proxy's forwarded origin only when it matches the request.
  const configured = process.env.APP_ORIGIN?.replace(/\/$/, '');
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwarded = forwardedProto && forwardedHost ? `${forwardedProto}://${forwardedHost}` : null;
  const allowed = new Set([configured, request.nextUrl.origin, forwarded].filter(Boolean));
  if (!allowed.has(origin)) throw new ApiError(403, '请求来源无效');
}

export async function readJson<T>(request: NextRequest, maxBytes = 64 * 1024): Promise<T> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > maxBytes) throw new ApiError(413, '请求内容过大');
  const body = await request.text();
  if (new TextEncoder().encode(body).length > maxBytes) throw new ApiError(413, '请求内容过大');
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new ApiError(400, 'JSON 格式无效');
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function apiError(error: unknown) {
  const status =
    error instanceof ApiError
      ? error.status
      : error instanceof Error && error.message.includes('DATABASE_URL')
        ? 503
        : 500;
  const message =
    error instanceof ApiError
      ? error.message
      : status === 503
        ? '云端服务尚未配置'
        : '服务器内部错误';
  return NextResponse.json({ error: message }, { status });
}
