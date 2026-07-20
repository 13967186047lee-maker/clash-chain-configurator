import { describe, expect, it } from 'vitest';
import { parseClashYaml, parseNodeLink, parseProxyLinks } from './proxy-parser';

describe('proxy parser', () => {
  it('parses vless links', () => {
    const node = parseNodeLink('vless://uuid@example.com:443?security=tls&type=ws&path=%2Fws#node');
    expect(node).toMatchObject({
      type: 'vless',
      name: 'node',
      server: 'example.com',
      port: 443,
      uuid: 'uuid',
    });
  });

  it('parses full Mihomo YAML', () => {
    const nodes = parseClashYaml(
      'proxies:\n  - name: one\n    type: ss\n    server: example.com\n    port: 443\n    cipher: aes-128-gcm\n    password: secret',
    );
    expect(nodes).toHaveLength(1);
  });

  it('rejects YAML aliases', () => {
    expect(() =>
      parseClashYaml('- &node { name: one, type: ss, server: example.com }\n- *node'),
    ).toThrow(/锚点/);
  });

  it('keeps valid nodes when a batch contains malformed links', () => {
    const nodes = parseProxyLinks(
      'not-a-node\ntrojan://secret@example.com:443#edge\ninvalid://value',
    );
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ type: 'trojan', name: 'edge', server: 'example.com' });
  });
});
