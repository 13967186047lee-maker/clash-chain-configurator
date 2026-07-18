import { createHmac, randomInt } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { Resend } from 'resend';
import { getDb } from './db';
import { emailCodes } from './db/schema';
import { ApiError, safeEqual } from './security';

export type EmailCodePurpose = 'registration' | 'password_reset';

const CODE_TTL_MS = 10 * 60_000;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

function codeSecret() {
  const secret = process.env.EMAIL_CODE_SECRET;
  if (!secret || secret.length < 32) throw new Error('EMAIL_CODE_SECRET is not configured');
  return secret;
}

function hashCode(email: string, purpose: EmailCodePurpose, code: string) {
  return createHmac('sha256', codeSecret()).update(`${email}:${purpose}:${code}`).digest('hex');
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function issueEmailCode(emailInput: string, purpose: EmailCodePurpose) {
  const email = normalizeEmail(emailInput);
  const db = getDb();
  const now = new Date();
  const [existing] = await db
    .select({ createdAt: emailCodes.createdAt })
    .from(emailCodes)
    .where(
      and(
        eq(emailCodes.email, email),
        eq(emailCodes.purpose, purpose),
        isNull(emailCodes.consumedAt),
        gt(emailCodes.expiresAt, now),
      ),
    )
    .limit(1);
  if (existing && existing.createdAt.getTime() > now.getTime() - RESEND_COOLDOWN_MS) return;

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  await db
    .delete(emailCodes)
    .where(and(eq(emailCodes.email, email), eq(emailCodes.purpose, purpose)));
  await db.insert(emailCodes).values({
    email,
    purpose,
    codeHash: hashCode(email, purpose, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  try {
    await sendVerificationEmail(email, code, purpose);
  } catch (error) {
    await db
      .delete(emailCodes)
      .where(and(eq(emailCodes.email, email), eq(emailCodes.purpose, purpose)));
    throw error;
  }
}

export async function consumeEmailCode(
  emailInput: string,
  purpose: EmailCodePurpose,
  code: string,
) {
  const email = normalizeEmail(emailInput);
  const db = getDb();
  const [challenge] = await db
    .select()
    .from(emailCodes)
    .where(
      and(
        eq(emailCodes.email, email),
        eq(emailCodes.purpose, purpose),
        isNull(emailCodes.consumedAt),
        gt(emailCodes.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!challenge) throw new ApiError(400, '验证码无效或已过期');
  if (challenge.attempts >= MAX_ATTEMPTS) throw new ApiError(429, '验证码尝试次数过多，请重新发送');
  const valid = safeEqual(challenge.codeHash, hashCode(email, purpose, code));
  if (!valid) {
    await db
      .update(emailCodes)
      .set({ attempts: challenge.attempts + 1 })
      .where(eq(emailCodes.id, challenge.id));
    throw new ApiError(400, '验证码错误');
  }
  await db
    .update(emailCodes)
    .set({ consumedAt: new Date() })
    .where(eq(emailCodes.id, challenge.id));
}

async function sendVerificationEmail(email: string, code: string, purpose: EmailCodePurpose) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) throw new Error('Resend is not configured');
  const resend = new Resend(apiKey);
  const template = emailTemplate(code, purpose);
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  if (error) throw new Error(`邮件发送失败：${error.message}`);
}

export function emailTemplate(code: string, purpose: EmailCodePurpose) {
  const isRegistration = purpose === 'registration';
  const title = isRegistration ? '验证你的邮箱' : '重置登录密码';
  const subject = isRegistration
    ? '你的 Clash 链式代理配置器注册验证码'
    : '你的 Clash 链式代理配置器密码重置验证码';
  const intro = isRegistration
    ? '你正在注册 Clash 链式代理配置器账号。'
    : '我们收到了重置你登录密码的请求。';
  const footer = isRegistration
    ? '验证完成后即可启用零知识云端保险库。'
    : '重置登录密码不会改变保险库密码，也无法恢复遗失的保险库密码。';
  const text = `${title}\n\n${intro}\n\n验证码：${code}\n\n验证码将在 10 分钟后失效。请勿将验证码告诉任何人。\n\n${footer}\n\n如果这不是你的操作，请忽略此邮件。`;
  const html = `<!doctype html><html lang="zh-CN"><body style="margin:0;background:#f4f4f5;font-family:Arial,'PingFang SC','Microsoft YaHei',sans-serif;color:#18181b"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e4e4e7;border-radius:8px"><tr><td style="padding:32px"><div style="font-size:13px;color:#71717a;margin-bottom:12px">Clash 链式代理配置器</div><h1 style="font-size:24px;line-height:1.3;margin:0 0 16px">${title}</h1><p style="font-size:15px;line-height:1.7;margin:0 0 24px;color:#3f3f46">${intro}</p><div style="background:#f4f4f5;border:1px solid #e4e4e7;border-radius:6px;padding:20px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px">${code}</div><p style="font-size:13px;line-height:1.7;margin:20px 0 0;color:#71717a">验证码将在 10 分钟后失效。请勿将验证码告诉任何人。</p><p style="font-size:13px;line-height:1.7;margin:12px 0 0;color:#71717a">${footer}</p></td></tr><tr><td style="border-top:1px solid #e4e4e7;padding:20px 32px;font-size:12px;color:#a1a1aa">如果这不是你的操作，请忽略此邮件。</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}
