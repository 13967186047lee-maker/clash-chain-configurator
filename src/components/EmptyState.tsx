import { Plus } from 'lucide-react';
import { Button } from './ui/button';

/**
 * 统一的空状态呈现：图标 + 主文案 + 提示 + 可选的添加入口。
 */
export default function EmptyState({
  icon,
  text,
  hint,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  text: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm font-medium">{text}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-2 border-dashed" onClick={onAction}>
          <Plus className="h-3.5 w-3.5" /> {actionLabel}
        </Button>
      )}
    </div>
  );
}
