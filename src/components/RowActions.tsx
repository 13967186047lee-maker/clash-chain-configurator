import { Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

/**
 * 列表行的编辑/删除操作组。移动端常显，桌面端悬停行时显现。
 */
export default function RowActions({
  onEdit,
  onRemove,
}: {
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} title="编辑">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
        title="删除"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
