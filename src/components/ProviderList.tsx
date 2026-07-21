import EmptyState from './EmptyState';
import RowActions from './RowActions';
import { Clock, FileText, Link, Satellite } from 'lucide-react';

interface ProviderListProps {
  providers: ProxyProviderExtend[];
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  /** 可选：为空状态提供"立即添加"入口 */
  onAdd?: () => void;
}

export default function ProviderList({ providers, onRemove, onEdit, onAdd }: ProviderListProps) {
  if (providers.length === 0) {
    return (
      <EmptyState
        icon={<Satellite className="h-6 w-6" />}
        text="还没有机场订阅"
        hint="添加 HTTP 订阅地址或 Inline 节点内容"
        actionLabel={onAdd ? '添加第一个机场' : undefined}
        onAction={onAdd}
      />
    );
  }

  return (
    <div className="divide-y">
      {providers.map((provider, index) => (
        <div
          key={index}
          className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50 sm:px-5"
        >
          <span
            className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${
              provider.type === 'inline'
                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
            }`}
          >
            {provider.type || 'http'}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {provider.name || `Provider ${index + 1}`}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              {provider.type === 'inline' ? (
                <>
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {provider.payloadContent
                      ? `${provider.payloadContent.slice(0, 80)}${provider.payloadContent.length > 80 ? '…' : ''}`
                      : '无节点内容'}
                  </span>
                </>
              ) : (
                <>
                  <Link className="h-3 w-3 shrink-0" />
                  <span className="truncate" title={provider.url}>
                    {provider.url || '未设置订阅地址'}
                  </span>
                  <span className="hidden shrink-0 items-center gap-1 sm:flex">
                    <Clock className="h-3 w-3" />
                    {provider.interval || 86400}s
                  </span>
                </>
              )}
            </div>
          </div>
          <RowActions onEdit={() => onEdit(index)} onRemove={() => onRemove(index)} />
        </div>
      ))}
    </div>
  );
}
