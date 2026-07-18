import * as yaml from 'js-yaml';
import baseConfig from '@/app/clash/baseConfig.yaml';
import { parseInlinePayload } from './proxy-parser';

export type ConfiguratorState = {
  providers: ProxyProviderExtend[];
  proxyNodes: ProxyNode[];
};

export type ConfigBuildResult = { config: ClashConfig; content: string; errors: string[] };

const REQUIRED_FIELDS: Partial<Record<string, string[]>> = {
  vmess: ['uuid', 'alterId', 'cipher'],
  vless: ['uuid'],
  trojan: ['password'],
  ss: ['cipher', 'password'],
  hysteria2: ['password'],
  wireguard: ['private-key', 'public-key', 'ip'],
  ssh: ['username'],
};

function cloneBaseConfig(): ClashConfig {
  return structuredClone(baseConfig as ClashConfig);
}

export function validateProxyNode(node: ProxyNode, index = 0): string[] {
  const prefix = `节点 ${index + 1}`;
  const errors: string[] = [];
  if (!node.name?.trim()) errors.push(`${prefix}缺少名称`);
  if (!node.type?.trim()) errors.push(`${prefix}缺少类型`);
  if (!node.server?.trim()) errors.push(`${prefix}缺少服务器地址`);
  if (!Number.isInteger(Number(node.port)) || Number(node.port) < 1 || Number(node.port) > 65535) {
    errors.push(`${prefix}端口必须在 1-65535 之间`);
  }
  for (const field of REQUIRED_FIELDS[node.type] || []) {
    if (node[field] === undefined || node[field] === '') errors.push(`${prefix}缺少 ${field}`);
  }
  return errors;
}

export function buildMihomoConfig(state: ConfiguratorState): ConfigBuildResult {
  const errors: string[] = [];
  const config = cloneBaseConfig();
  config['proxy-providers'] = {};
  config.proxies = state.proxyNodes.map((node) => ({
    ...structuredClone(node),
    'dialer-proxy': '手动选择',
  })) as ProxyNode[];
  config['proxy-groups'] = [];

  const providerNames = new Set<string>();
  for (const provider of state.providers) {
    const name = provider.name?.trim();
    if (!name) {
      errors.push('机场名称不能为空');
      continue;
    }
    if (providerNames.has(name)) {
      errors.push(`机场名称重复：${name}`);
      continue;
    }
    providerNames.add(name);
    if (provider.type === 'http' && !provider.url) errors.push(`机场 ${name} 缺少订阅地址`);
    try {
      config['proxy-providers'][name] = {
        type: provider.type,
        ...(provider.type === 'http'
          ? { url: provider.url, interval: provider.interval || 86400 }
          : {}),
        ...(provider.type === 'inline'
          ? { payload: parseInlinePayload(provider.payloadContent || '') }
          : {}),
        override: {
          'additional-prefix': state.providers.length > 1 ? `${name} ` : undefined,
        },
      } as ProxyProvider;
    } catch (error) {
      errors.push(`机场 ${name}：${error instanceof Error ? error.message : '节点内容无效'}`);
    }
  }

  const nodeNames = new Set<string>();
  config.proxies.forEach((node, index) => {
    errors.push(...validateProxyNode(node, index));
    if (nodeNames.has(node.name)) errors.push(`落地节点名称重复：${node.name}`);
    nodeNames.add(node.name);
  });

  const keys = Object.keys(config['proxy-providers']);
  if (keys.length) {
    config['proxy-groups'] = [
      {
        name: '我的代理',
        type: 'select',
        proxies: [...config.proxies.map((node) => node.name), '手动选择'],
      },
      { name: '手动选择', type: 'select', use: keys, proxies: ['自动选择'] },
      {
        name: '自动选择',
        type: 'url-test',
        use: keys,
        url: 'https://www.gstatic.com/generate_204',
        interval: 3600,
        lazy: true,
      },
    ];
  }

  return { config, content: serializeMihomoConfig(config), errors };
}

export function serializeMihomoConfig(config: ClashConfig) {
  return yaml.dump(config, { lineWidth: -1, noRefs: true, sortKeys: false });
}
