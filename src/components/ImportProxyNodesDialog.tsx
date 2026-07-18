import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { toast } from './ui/sonner';
import jsQR from 'jsqr';
import { parseClashYaml, parseNodeLink } from '@/lib/proxy-parser';

interface ImportProxyNodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (nodes: ProxyNode[]) => void;
  existingNames: string[];
}

/* Parsers are shared with provider inline imports in src/lib/proxy-parser. */
/*
function parseVmessLink(link: string): ProxyNode | null {
  try {
    const encoded = link.replace('vmess://', '');
    const decoded = JSON.parse(atob(encoded));
    return {
      name: decoded.ps || decoded.name || `vmess-${decoded.add}`,
      type: 'vmess',
      server: decoded.add,
      port: Number(decoded.port),
      uuid: decoded.id,
      alterId: Number(decoded.aid) || 0,
      cipher: 'auto',
      tls: decoded.tls === 'tls',
      servername: decoded.sni || decoded.host,
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

function parseVlessLink(link: string): ProxyNode | null {
  try {
    const url = new URL(link);
    const params = url.searchParams;
    return {
      name: decodeURIComponent(url.hash.slice(1)) || `vless-${url.hostname}`,
      type: 'vless',
      server: url.hostname,
      port: Number(url.port) || 443,
      uuid: url.username,
      encryption: '',
      flow: params.get('flow') || undefined,
      tls: params.get('security') === 'tls' || params.get('security') === 'reality',
      servername: params.get('sni') || undefined,
      network: params.get('type') || 'tcp',
      udp: true,
      'skip-cert-verify': true,
      ...(params.get('type') === 'ws' && {
        'ws-opts': {
          path: params.get('path') || '/',
          headers: params.get('host') ? { Host: params.get('host')! } : undefined,
        },
      }),
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

function parseTrojanLink(link: string): ProxyNode | null {
  try {
    const url = new URL(link);
    const params = url.searchParams;
    return {
      name: decodeURIComponent(url.hash.slice(1)) || `trojan-${url.hostname}`,
      type: 'trojan',
      server: url.hostname,
      port: Number(url.port) || 443,
      password: decodeURIComponent(url.username),
      sni: params.get('sni') || url.hostname,
      network: params.get('type') || 'tcp',
      udp: true,
      'skip-cert-verify': true,
      ...(params.get('type') === 'ws' && {
        'ws-opts': {
          path: params.get('path') || '/',
          headers: params.get('host') ? { Host: params.get('host')! } : undefined,
        },
      }),
    } as ProxyNode;
  } catch {
    return null;
  }
}

function parseSsLink(link: string): ProxyNode | null {
  try {
    let encoded = link.replace('ss://', '');
    let name = '';
    const hashIndex = encoded.indexOf('#');
    if (hashIndex !== -1) {
      name = decodeURIComponent(encoded.slice(hashIndex + 1));
      encoded = encoded.slice(0, hashIndex);
    }

    const atIndex = encoded.lastIndexOf('@');
    let userInfo: string, serverInfo: string;

    if (atIndex !== -1) {
      userInfo = encoded.slice(0, atIndex);
      serverInfo = encoded.slice(atIndex + 1);
    } else {
      const decoded = atob(encoded);
      const parts = decoded.split('@');
      userInfo = parts[0];
      serverInfo = parts[1];
    }

    let cipher: string, password: string;
    try {
      const decodedUserInfo = atob(userInfo);
      [cipher, password] = decodedUserInfo.split(':');
    } catch {
      [cipher, password] = userInfo.split(':');
    }

    const [server, port] = serverInfo.split(':');

    return {
      name: name || `ss-${server}`,
      type: 'ss',
      server,
      port: Number(port),
      cipher,
      password,
      udp: true,
    } as ProxyNode;
  } catch {
    return null;
  }
}

function parseHysteria2Link(link: string): ProxyNode | null {
  try {
    const url = new URL(link);
    const params = url.searchParams;
    return {
      name: decodeURIComponent(url.hash.slice(1)) || `hy2-${url.hostname}`,
      type: 'hysteria2',
      server: url.hostname,
      port: Number(url.port) || 443,
      password: decodeURIComponent(url.username),
      sni: params.get('sni') || url.hostname,
      obfs: params.get('obfs') || undefined,
      'obfs-password': params.get('obfs-password') || undefined,
      'skip-cert-verify': true,
    } as ProxyNode;
  } catch {
    return null;
  }
}

function parseNodeLink(link: string): ProxyNode | null {
  const trimmed = link.trim();
  if (trimmed.startsWith('vmess://')) return parseVmessLink(trimmed);
  if (trimmed.startsWith('vless://')) return parseVlessLink(trimmed);
  if (trimmed.startsWith('trojan://')) return parseTrojanLink(trimmed);
  if (trimmed.startsWith('ss://')) return parseSsLink(trimmed);
  if (trimmed.startsWith('hysteria2://') || trimmed.startsWith('hy2://'))
    return parseHysteria2Link(trimmed);
  return null;
}
*/

function isClashYaml(text: string): boolean {
  const trimmed = text.trim();
  // Check for common Clash YAML patterns
  return (
    trimmed.startsWith('proxies:') ||
    (trimmed.startsWith('- ') && trimmed.includes('type:') && trimmed.includes('server:')) ||
    (trimmed.includes('name:') && trimmed.includes('type:') && trimmed.includes('server:'))
  );
}

function isValidNodeLink(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.startsWith('vmess://') ||
    trimmed.startsWith('vless://') ||
    trimmed.startsWith('trojan://') ||
    trimmed.startsWith('ss://') ||
    trimmed.startsWith('hysteria2://') ||
    trimmed.startsWith('hy2://')
  );
}

async function decodeQRFromImage(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      resolve(code?.data || null);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(blob);
  });
}

export default function ImportProxyNodesDialog({
  open,
  onOpenChange,
  onImport,
  existingNames,
}: ImportProxyNodesDialogProps) {
  const [input, setInput] = useState('');

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;

    if (clipboardData.types.includes('text/plain')) {
      const text = clipboardData.getData('text/plain');
      if (text) {
        return;
      }
    }

    const imageItem = Array.from(clipboardData.items).find((item) =>
      item.type.startsWith('image/'),
    );

    if (imageItem) {
      e.preventDefault();
      const blob = imageItem.getAsFile();
      if (!blob) {
        toast.error('读取图片失败');
        return;
      }

      const decoded = await decodeQRFromImage(blob);
      if (!decoded) {
        toast.error('从图片解码二维码失败');
        return;
      }

      if (!isValidNodeLink(decoded)) {
        toast.error('二维码不包含有效的代理节点链接');
        return;
      }

      setInput((prev) => (prev ? prev + '\n' + decoded : decoded));
      toast.success('二维码解码成功');
    }
  }, []);

  const handleImport = () => {
    const nodes: ProxyNode[] = [];
    const errors: string[] = [];

    // First, try to parse as Clash YAML
    if (isClashYaml(input)) {
      const yamlNodes = parseClashYaml(input);
      for (const node of yamlNodes) {
        let name = node.name;
        let counter = 1;
        while (existingNames.includes(name) || nodes.some((n) => n.name === name)) {
          name = `${node.name}-${counter++}`;
        }
        node.name = name;
        nodes.push(node);
      }
    } else {
      // Fall back to parsing as individual links
      const lines = input.split('\n').filter((line) => line.trim());
      for (const line of lines) {
        const node = parseNodeLink(line);
        if (node) {
          let name = node.name;
          let counter = 1;
          while (existingNames.includes(name) || nodes.some((n) => n.name === name)) {
            name = `${node.name}-${counter++}`;
          }
          node.name = name;
          nodes.push(node);
        } else {
          errors.push(line.slice(0, 50) + (line.length > 50 ? '...' : ''));
        }
      }
    }

    if (nodes.length > 0) {
      onImport(nodes);
      toast.success(`已导入 ${nodes.length} 个节点`, {
        description: errors.length > 0 ? `${errors.length} 个链接解析失败` : undefined,
      });
      setInput('');
      onOpenChange(false);
    } else {
      toast.error('未找到有效节点', {
        description: '请检查输入格式 (vmess://, vless://, trojan://, ss://, hy2://, 或 Clash YAML)',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:w-[500px]">
        <DialogHeader>
          <DialogTitle>导入落地节点</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label>粘贴节点链接或 Clash YAML</Label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              placeholder="vmess://...&#10;vless://...&#10;或 Clash YAML 格式:&#10; - name: node1..."
              className="min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            支持: 节点链接 (vmess://, vless://, trojan://, ss://, hy2://) 或 Clash YAML 格式
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={!input.trim()}>
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
