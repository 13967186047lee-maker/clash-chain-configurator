'use client';

import { argon2id } from 'hash-wasm';

export type VaultDocument = { providers: ProxyProviderExtend[]; proxyNodes: ProxyNode[] };
export type EncryptedEnvelope = {
  formatVersion: 1;
  kdf: { name: 'argon2id'; iterations: number; memorySize: number; parallelism: number };
  salt: string;
  nonce: string;
  ciphertext: string;
  checksum: string;
  revision?: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const KDF = { name: 'argon2id' as const, iterations: 3, memorySize: 64 * 1024, parallelism: 1 };

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(binary);
};

const fromBase64 = (value: string) =>
  new Uint8Array(Array.from(atob(value), (character) => character.charCodeAt(0)));
const checksum = async (value: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

async function deriveKey(password: string, salt: Uint8Array, kdf = KDF) {
  const bytes = await argon2id({
    password,
    salt,
    iterations: kdf.iterations,
    memorySize: kdf.memorySize,
    parallelism: kdf.parallelism,
    hashLength: 32,
    outputType: 'binary',
  });
  return crypto.subtle.importKey('raw', new Uint8Array(bytes).buffer, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptVault(
  document: VaultDocument,
  password: string,
  existing?: Pick<EncryptedEnvelope, 'salt' | 'revision'>,
): Promise<EncryptedEnvelope> {
  if (password.length < 12) throw new Error('保险库密码至少需要 12 个字符');
  const salt = existing ? fromBase64(existing.salt) : crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = JSON.stringify(document);
  const key = await deriveKey(password, salt);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce.buffer,
        additionalData: encoder.encode('clash-chain-configurator:v1'),
      },
      key,
      encoder.encode(plaintext),
    ),
  );
  const encoded = toBase64(ciphertext);
  return {
    formatVersion: 1,
    kdf: KDF,
    salt: toBase64(salt),
    nonce: toBase64(nonce),
    ciphertext: encoded,
    checksum: await checksum(encoded),
    revision: existing?.revision,
  };
}

export async function decryptVault(
  envelope: EncryptedEnvelope,
  password: string,
): Promise<VaultDocument> {
  if (envelope.formatVersion !== 1 || envelope.kdf.name !== 'argon2id')
    throw new Error('不支持的加密备份版本');
  if ((await checksum(envelope.ciphertext)) !== envelope.checksum)
    throw new Error('密文校验失败，数据可能已损坏');
  try {
    const key = await deriveKey(password, fromBase64(envelope.salt), envelope.kdf);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: fromBase64(envelope.nonce).buffer,
        additionalData: encoder.encode('clash-chain-configurator:v1'),
      },
      key,
      fromBase64(envelope.ciphertext).buffer,
    );
    const parsed = JSON.parse(decoder.decode(plaintext));
    if (!Array.isArray(parsed.providers) || !Array.isArray(parsed.proxyNodes)) throw new Error();
    return parsed as VaultDocument;
  } catch {
    throw new Error('无法解密：密码错误或数据已被篡改');
  }
}

export function downloadEnvelope(envelope: EncryptedEnvelope) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `clash-chain-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
