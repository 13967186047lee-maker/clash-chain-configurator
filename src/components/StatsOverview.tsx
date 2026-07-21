import { Link2, Satellite, Server, type LucideIcon } from 'lucide-react';
import { CONFIG_STATUS_META, type ConfigStatus } from './config-status';

interface StatsOverviewProps {
  providers: ProxyProviderExtend[];
  proxyNodes: ProxyNode[];
  /** 由调用方通过 getConfigStatus 计算一次后传入，避免重复求值 */
  status: ConfigStatus;
  errorCount: number;
}

/**
 * 配置总览：机场 / 落地节点 / 链式链路 / 配置状态四张统计卡。
 * 链式链路数在模块内部推导，状态呈现复用 CONFIG_STATUS_META。
 */
export default function StatsOverview({
  providers,
  proxyNodes,
  status,
  errorCount,
}: StatsOverviewProps) {
  const chainedLinkCount = providers.length > 0 ? proxyNodes.length : 0;
  const statusMeta = CONFIG_STATUS_META[status];

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        icon={Satellite}
        tint="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        value={providers.length}
        label="机场订阅"
      />
      <StatCard
        icon={Server}
        tint="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        value={proxyNodes.length}
        label="落地节点"
      />
      <StatCard
        icon={Link2}
        tint="bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400"
        value={chainedLinkCount}
        label="链式链路"
      />
      <StatCard
        icon={statusMeta.icon}
        tint={statusMeta.tint}
        value={statusMeta.cardValue(errorCount)}
        label={statusMeta.cardLabel}
      />
    </section>
  );
}

function StatCard({
  icon: Icon,
  tint,
  value,
  label,
}: {
  icon: LucideIcon;
  tint: string;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-none tabular-nums">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
