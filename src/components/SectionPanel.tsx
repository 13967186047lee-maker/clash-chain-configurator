import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionPanelProps {
  icon: LucideIcon;
  title: string;
  count?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** 图标底托着色，用于按领域区分区块；默认为 primary 色调 */
  iconTint?: string;
  className?: string;
}

/**
 * 工作区区块容器：统一的标题栏（图标 + 标题 + 数量徽标 + 操作区）+ 内容区。
 * 只负责呈现，不持有任何业务状态。
 */
export default function SectionPanel({
  icon: Icon,
  title,
  count,
  actions,
  children,
  iconTint = 'bg-primary/10 text-primary',
  className,
}: SectionPanelProps) {
  return (
    <section className={cn('rounded-2xl border bg-card shadow-sm', className)}>
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3.5 sm:px-5">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <span
            className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', iconTint)}
          >
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate">{title}</span>
          {count !== undefined && (
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
        </h2>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
