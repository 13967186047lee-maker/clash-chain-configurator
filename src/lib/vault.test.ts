import { beforeAll, describe, expect, it } from 'vitest';
import { webcrypto } from 'node:crypto';
import { decryptVault, encryptVault } from './vault';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
});

describe('zero-knowledge vault', () => {
  it('round trips and rejects the wrong password', async () => {
    const document = { providers: [], proxyNodes: [] };
    const envelope = await encryptVault(document, 'correct horse battery staple');
    await expect(decryptVault(envelope, 'correct horse battery staple')).resolves.toEqual(document);
    await expect(decryptVault(envelope, 'this password is definitely wrong')).rejects.toThrow(
      /无法解密/,
    );
  }, 30_000);

  it('detects ciphertext tampering before decryption', async () => {
    const envelope = await encryptVault(
      { providers: [], proxyNodes: [] },
      'correct horse battery staple',
    );
    envelope.ciphertext = `${envelope.ciphertext.slice(0, -2)}AA`;
    await expect(decryptVault(envelope, 'correct horse battery staple')).rejects.toThrow(
      /校验失败/,
    );
  }, 30_000);
});
