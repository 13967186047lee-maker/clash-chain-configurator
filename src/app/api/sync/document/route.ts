import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser, writeAudit } from '@/server/auth';
import { getDb } from '@/server/db';
import { encryptedDocuments } from '@/server/db/schema';
import { ApiError, apiError, enforceRateLimit, readJson, validateCsrf } from '@/server/security';

const envelopeSchema = z.object({
  formatVersion: z.literal(1),
  kdf: z.object({
    name: z.enum(['argon2id', 'pbkdf2-sha256']),
    iterations: z.number().int().positive().optional(),
    memorySize: z.number().int().positive().optional(),
    parallelism: z.number().int().positive().optional(),
  }),
  salt: z.string().min(16).max(256),
  nonce: z.string().min(12).max(256),
  ciphertext: z.string().min(1).max(8_000_000),
  checksum: z.string().length(64),
  revision: z.number().int().nonnegative().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const current = await requireUser(request);
    const [document] = await getDb()
      .select()
      .from(encryptedDocuments)
      .where(eq(encryptedDocuments.userId, current.user.id))
      .limit(1);
    return NextResponse.json({ document: document || null });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    validateCsrf(request);
    const current = await requireUser(request);
    enforceRateLimit(`sync:${current.user.id}`, 60, 60_000);
    const input = envelopeSchema.parse(await readJson(request, 6 * 1024 * 1024));
    const sizeBytes = Buffer.byteLength(input.ciphertext, 'utf8');
    if (sizeBytes > current.user.quotaBytes) throw new ApiError(413, '密文超过账号存储配额');
    const db = getDb();
    const [existing] = await db
      .select()
      .from(encryptedDocuments)
      .where(eq(encryptedDocuments.userId, current.user.id))
      .limit(1);
    if (existing && input.revision !== existing.revision)
      throw new ApiError(409, '云端数据已被其他设备更新');
    const values = {
      formatVersion: input.formatVersion,
      kdf: input.kdf,
      salt: input.salt,
      nonce: input.nonce,
      ciphertext: input.ciphertext,
      checksum: input.checksum,
      sizeBytes,
      revision: (existing?.revision || 0) + 1,
      updatedAt: new Date(),
    };
    if (existing)
      await db.update(encryptedDocuments).set(values).where(eq(encryptedDocuments.id, existing.id));
    else await db.insert(encryptedDocuments).values({ ...values, userId: current.user.id });
    await writeAudit('sync.saved', current.user.id, current.user.id, { sizeBytes });
    return NextResponse.json({ ok: true, revision: values.revision });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    validateCsrf(request);
    const current = await requireUser(request);
    await getDb().delete(encryptedDocuments).where(eq(encryptedDocuments.userId, current.user.id));
    await writeAudit('sync.deleted', current.user.id, current.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
