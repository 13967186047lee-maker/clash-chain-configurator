import EmptyState from './EmptyState';
import RowActions from './RowActions';
import { Server, Shield } from 'lucide-react';

interface FinalProxyNodeListProps {
  proxyNodes: ProxyNode[];
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  /** 可选：为空状态提供"立即添加"入口 */
  onAdd?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  http: 'HTTP',
  socks5: 'SOCKS5',
  ss: 'Shadowsocks',
  ssr: 'ShadowsocksR',
  snell: 'Snell',
  vmess: 'VMess',
  vless: 'VLESS',
  trojan: 'Trojan',
  anytls: 'AnyTLS',
  mieru: 'Mieru',
  sudoku: 'Sudoku',
  hysteria: 'Hysteria',
  hysteria2: 'Hysteria2',
  tuic: 'TUIC',
  wireguard: 'WireGuard',
  ssh: 'SSH',
};

export default function FinalProxyNodeList({
  proxyNodes,
  onRemove,
  onEdit,
  onAdd,
}: FinalProxyNodeListProps) {
  if (proxyNodes.length === 0) {
    return (
      <EmptyState
        icon={<Server className="h-6 w-6" />}
        text="还没有落地节点"
        hint="手动添加，或从订阅链接 / 二维码批量导入"
        actionLabel={onAdd ? '添加第一个节点' : undefined}
        onAction={onAdd}
      />
    );
  }

  return (
    <div className="divide-y">
      {proxyNodes.map((node, index) => {
        const tlsEnabled = Boolean(
          node.tls || node.type === 'trojan' || node.type === 'vless' || node.type === 'vmess',
        );
        const { sni, servername } = node as { sni?: string; servername?: string };
        const tlsName = sni ?? servername;
        return (
          <div
            key={index}
            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 sm:px-5"
          >
            <span className="shrink-0 rounded-md bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
              {TYPE_LABELS[node.type] || node.type}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {node.name || `Proxy ${index + 1}`}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Server className="h-3 w-3 shrink-0" />
                  <span className="truncate" title={`${node.server}:${node.port}`}>
                    {node.server}:{node.port}
                  </span>
                </span>
                {tlsEnabled && (
                  <span className="hidden shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400 sm:flex">
                    <Shield className="h-3 w-3" />
                    {node.tls ? 'TLS' : 'TLS 可用'}
                    {tlsName ? ` (${tlsName})` : ''}
                  </span>
                )}
              </div>
            </div>
            <RowActions onEdit={() => onEdit(index)} onRemove={() => onRemove(index)} />
          </div>
        );
      })}
    </div>
  );
}
