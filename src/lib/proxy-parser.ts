import * as yaml from 'js-yaml';

const MAX_YAML_BYTES = 512 * 1024;
const SUPPORTED_SCHEMES = ['vmess://', 'vless://', 'trojan://', 'ss://', 'hysteria2://', 'hy2://'];

function decodeBase64(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

export function parseVmessLink(link: string): ProxyNode | null {
  try {
    const decoded = JSON.parse(decodeBase64(link.slice('vmess://'.length)));
    if (!decoded.add || !decoded.port || !decoded.id) return null;
    return {
      name: decoded.ps || decoded.name || `vmess-${decoded.add}`,
      type: 'vmess',
      server: decoded.add,
      port: Number(decoded.port),
      uuid: decoded.id,
      alterId: Number(decoded.aid) || 0,
      cipher: 'auto',
      tls: decoded.tls === 'tls',
      servername: decoded.sni || decoded.host || undefined,
      network: decoded.net || 'tcp',
      udp: true,
      'skip-cert-verify': true,
      ...(decoded.net === 'ws' && {
        'ws-opts': {
          path: decoded.path || '/',
          headers: decoded.host ? { Host: decoded.host } : undefined,
        },
      }),
    } as ProxyNode;
  } catch {
    return null;
  }
}

function parseUrlLink(link: string, type: 'vless' | 'trojan' | 'hysteria2'): ProxyNode | null {
  try {
    const normalized = link.startsWith('hy2://') ? `hysteria2://${link.slice(6)}` : link;
    const url = new URL(normalized);
    const params = url.searchParams;
    const name = decodeURIComponent(url.hash.slice(1)) || `${type}-${url.hostname}`;
    if (!url.hostname || !url.username) return null;

    if (type === 'hysteria2') {
      return {
        name,
        type,
        server: url.hostname,
        port: Number(url.port) || 443,
        password: decodeURIComponent(url.username),
        sni: params.get('sni') || url.hostname,
        obfs: params.get('obfs') || undefined,
        'obfs-password': params.get('obfs-password') || undefined,
        'skip-cert-verify': true,
      } as ProxyNode;
    }

    const common = {
      name,
      type,
      server: url.hostname,
      port: Number(url.port) || 443,
      network: params.get('type') || 'tcp',
      udp: true,
      'skip-cert-verify': true,
      ...(params.get('type') === 'ws' && {
        'ws-opts': {
          path: params.get('path') || '/',
          headers: params.get('host') ? { Host: params.get('host')! } : undefined,
        },
      }),
    };

    if (type === 'trojan') {
      return {
        ...common,
        password: decodeURIComponent(url.username),
        sni: params.get('sni') || url.hostname,
      } as ProxyNode;
    }

    return {
      ...common,
      uuid: url.username,
      encryption: '',
      flow: params.get('flow') || undefined,
      tls: params.get('security') === 'tls' || params.get('security') === 'reality',
      servername: params.get('sni') || undefined,
      ...(params.get('security') === 'reality' && {
        'reality-opts': {
          'public-key': params.get('pbk') || '',
          'short-id': params.get('sid') || '',
        },
        'client-fingerprint': params.get('fp') || 'chrome',
      }),
    } as ProxyNode;
  } catch {
    return null;
  }
}

export function parseSsLink(link: string): ProxyNode | null {
  try {
    const urlWithoutScheme = link.slice('ss://'.length);
    const [body, fragment = ''] = urlWithoutScheme.split('#', 2);
    const at = body.lastIndexOf('@');
    const decodedBody = at === -1 ? decodeBase64(body) : body;
    const separator = decodedBody.lastIndexOf('@');
    if (separator === -1) return null;
    let userInfo = decodedBody.slice(0, separator);
    const serverInfo = decodedBody.slice(separator + 1);
    if (!userInfo.includes(':')) userInfo = decodeBase64(userInfo);
    const colon = userInfo.indexOf(':');
    const serverColon = serverInfo.lastIndexOf(':');
    if (colon === -1 || serverColon === -1) return null;
    const server = serverInfo.slice(0, serverColon).replace(/^\[|\]$/g, '');
    return {
      name: decodeURIComponent(fragment) || `ss-${server}`,
      type: 'ss',
      server,
      port: Number(serverInfo.slice(serverColon + 1)),
      cipher: userInfo.slice(0, colon),
      password: userInfo.slice(colon + 1),
      udp: true,
    } as ProxyNode;
  } catch {
    return null;
  }
}

export function parseNodeLink(link: string): ProxyNode | null {
  const trimmed = link.trim();
  if (trimmed.startsWith('vmess://')) return parseVmessLink(trimmed);
  if (trimmed.startsWith('vless://')) return parseUrlLink(trimmed, 'vless');
  if (trimmed.startsWith('trojan://')) return parseUrlLink(trimmed, 'trojan');
  if (trimmed.startsWith('ss://')) return parseSsLink(trimmed);
  if (trimmed.startsWith('hysteria2://') || trimmed.startsWith('hy2://')) {
    return parseUrlLink(trimmed, 'hysteria2');
  }
  return null;
}

export function containsProxyLinks(text: string) {
  return text
    .split(/\r?\n/)
    .some((line) => SUPPORTED_SCHEMES.some((scheme) => line.trim().startsWith(scheme)));
}

export function parseProxyLinks(text: string) {
  return text
    .split(/\r?\n/)
    .map(parseNodeLink)
    .filter((node): node is ProxyNode => node !== null);
}

function assertSafeYaml(text: string) {
  if (new TextEncoder().encode(text).length > MAX_YAML_BYTES)
    throw new Error('YAML 内容不能超过 512 KB');
  if (/(^|\s)[&*][A-Za-z0-9_-]+/m.test(text) || /(^|\s)<<\s*:/m.test(text)) {
    throw new Error('为安全起见，不支持 YAML 锚点、别名或合并键');
  }
}

export function parseClashYaml(text: string): ProxyNode[] {
  assertSafeYaml(text);
  const parsed = yaml.load(text, { json: true }) as unknown;
  const candidates =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'proxies' in parsed
      ? (parsed as { proxies?: unknown }).proxies
      : parsed;
  const values = Array.isArray(candidates) ? candidates : [candidates];
  return values.filter(
    (node): node is ProxyNode =>
      !!node &&
      typeof node === 'object' &&
      typeof (node as Record<string, unknown>).name === 'string' &&
      typeof (node as Record<string, unknown>).type === 'string' &&
      typeof (node as Record<string, unknown>).server === 'string',
  );
}

export function parseInlinePayload(text: string): ProxyNode[] {
  const nodes = containsProxyLinks(text) ? parseProxyLinks(text) : parseClashYaml(text);
  if (!nodes.length) throw new Error('未找到有效的 Mihomo 代理节点');
  return nodes;
}

export function dumpProxyNodes(nodes: ProxyNode[]) {
  return yaml.dump(nodes, { lineWidth: -1, flowLevel: 1 });
}
