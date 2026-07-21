import { CheckCircle2, CircleDashed, XCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 配置状态的唯一计算与呈现入口。StatsOverview 的状态卡与预览面板的状态徽标
 * 都从 CONFIG_STATUS_META 取图标、着色与文案，保证全站判断与观感一致。
 */
export type ConfigStatus = 'ok' | 'errors' | 'empty';

export function getConfigStatus(configErrors: string[], providerCount: number): ConfigStatus {
  if (configErrors.length > 0) return 'errors';
  if (providerCount === 0) return 'empty';
  return 'ok';
}

export const CONFIG_STATUS_META: Record<
  ConfigStatus,
  {
    icon: LucideIcon;
    /** 图标底托着色（明暗双主题） */
    tint: string;
    /** 徽标容器类名 */
    badgeClassName: string;
    /** 徽标状态点类名 */
    dotClassName: string;
    /** 徽标文案 */
    badgeText: (errorCount: number) => string;
    /** 状态卡数值 */
    cardValue: (errorCount: number) => string;
    /** 状态卡说明 */
    cardLabel: string;
  }
> = {
  ok: {
    icon: CheckCircle2,
    tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    badgeClassName:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dotClassName: 'bg-emerald-500',
    badgeText: () => 'YAML 有效',
    cardValue: () => '有效',
    cardLabel: '配置状态',
  },
  errors: {
    icon: XCircle,
    tint: 'bg-destructive/10 text-destructive',
    badgeClassName: 'border-destructive/30 bg-destructive/10 text-destructive',
    dotClassName: 'bg-destructive',
    badgeText: (errorCount) => `${errorCount} 项错误`,
    cardValue: (errorCount) => `${errorCount} 项`,
    cardLabel: '配置错误',
  },
  empty: {
    icon: CircleDashed,
    tint: 'bg-secondary text-muted-foreground',
    badgeClassName: 'border-border bg-secondary text-muted-foreground',
    dotClassName: 'bg-muted-foreground',
    badgeText: () => '待配置',
    cardValue: () => '待配置',
    cardLabel: '配置状态',
  },
};

export function ConfigStatusBadge({
  status,
  errorCount,
  className,
}: {
  status: ConfigStatus;
  errorCount: number;
  className?: string;
}) {
  const meta = CONFIG_STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        meta.badgeClassName,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dotClassName)} />
      {meta.badgeText(errorCount)}
    </span>
  );
}
