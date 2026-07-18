import { describe, expect, it } from 'vitest';
import * as yaml from 'js-yaml';
import { buildMihomoConfig } from './mihomo';

const provider = {
  name: '机场 A',
  type: 'http',
  url: 'https://example.com/sub',
  interval: 86400,
} as ProxyProviderExtend;
const node = {
  name: '落地',
  type: 'vmess',
  server: 'edge.example.com',
  port: 443,
  uuid: '00000000-0000-4000-8000-000000000000',
  alterId: 0,
  cipher: 'auto',
} as ProxyNode;

describe('Mihomo config builder', () => {
  it('creates a fresh empty provider/group state', () => {
    const populated = buildMihomoConfig({ providers: [provider], proxyNodes: [node] });
    expect(populated.config['proxy-groups']).toHaveLength(3);
    const empty = buildMihomoConfig({ providers: [], proxyNodes: [] });
    expect(empty.config['proxy-groups']).toEqual([]);
    expect(empty.config['proxy-providers']).toEqual({});
  });

  it('adds the chain dialer and serializes parseable YAML', () => {
    const result = buildMihomoConfig({ providers: [provider], proxyNodes: [node] });
    expect(result.errors).toEqual([]);
    expect(result.config.proxies[0]['dialer-proxy']).toBe('手动选择');
    expect((yaml.load(result.content) as ClashConfig)['proxy-groups']).toHaveLength(3);
  });

  it('supports safe inline providers and prefixes multiple providers', () => {
    const inline = {
      name: '内联',
      type: 'inline',
      interval: 86400,
      payloadContent:
        '- name: first\n  type: ss\n  server: node.example.com\n  port: 443\n  cipher: aes-128-gcm\n  password: secret',
    } as ProxyProviderExtend;
    const result = buildMihomoConfig({ providers: [provider, inline], proxyNodes: [] });
    expect(result.errors).toEqual([]);
    expect(result.config['proxy-providers']['机场 A'].override?.['additional-prefix']).toBe(
      '机场 A ',
    );
    expect(result.config['proxy-providers']['内联'].payload).toHaveLength(1);
  });
});
