import { useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { toast } from './ui/sonner';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { containsProxyLinks, dumpProxyNodes, parseInlinePayload } from '@/lib/proxy-parser';

const providerSchema = z
  .object({
    name: z.string().min(1, '名称不能为空'),
    type: z.enum(['http', 'inline']),
    url: z.string().optional(),
    payloadContent: z.string().optional(),
    interval: z.coerce.number().min(60, '间隔至少 60 秒').default(86400),
  })
  .refine(
    (data) => {
      if (data.type === 'http') {
        return data.url && data.url.length > 0;
      }
      return true;
    },
    {
      message: 'HTTP类型需要订阅地址',
      path: ['url'],
    },
  )
  .refine(
    (data) => {
      if (data.type === 'http' && data.url) {
        try {
          new URL(data.url);
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },
    {
      message: '必须是有效的URL',
      path: ['url'],
    },
  )
  .refine(
    (data) => {
      if (data.type === 'inline') {
        return data.payloadContent && data.payloadContent.trim().length > 0;
      }
      return true;
    },
    {
      message: '内联类型需要节点内容',
      path: ['payload'],
    },
  );

type ProviderFormValues = z.infer<typeof providerSchema>;

interface ProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: ProxyProviderExtend | null;
  onSave: (provider: ProxyProviderExtend) => void;
  existingNames: string[];
}

export default function ProviderDialog({
  open,
  onOpenChange,
  provider,
  onSave,
  existingNames,
}: ProviderDialogProps) {
  const isEditing = !!provider;

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema) as any,
    defaultValues: {
      name: '',
      type: 'http',
      url: '',
      payloadContent: '',
      interval: 86400,
    },
  });

  const watchType = watch('type');

  const isBase64 = (str: string): boolean => {
    if (!str || str.length === 0) return false;
    const trimmed = str.trim();
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(trimmed)) return false;
    if (trimmed.length % 4 !== 0) return false;
    try {
      const decoded = atob(trimmed);
      return decoded.length > 0 && /[\x20-\x7E\r\n\t]/.test(decoded);
    } catch {
      return false;
    }
  };

  const handlePayloadPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const text = e.clipboardData.getData('text/plain');
      if (text && isBase64(text)) {
        e.preventDefault();
        try {
          const decoded = atob(text.trim());
          if (containsProxyLinks(decoded)) {
            const nodes = parseInlinePayload(decoded);
            if (nodes.length) {
              setValue('payloadContent', dumpProxyNodes(nodes));
              toast.success('代理链接已解码并转换为YAML');
              return;
            }
          }
          setValue('payloadContent', decoded);
          toast.success('Base64内容已解码');
        } catch {
          // If decoding fails, let the default paste happen
        }
      } else if (text && containsProxyLinks(text)) {
        e.preventDefault();
        const nodes = parseInlinePayload(text);
        if (nodes.length) {
          setValue('payloadContent', dumpProxyNodes(nodes));
          toast.success('代理链接已转换为YAML');
        }
      }
    },
    [setValue],
  );

  useEffect(() => {
    if (open && provider) {
      reset({
        name: provider.name,
        type: (provider.type as 'http' | 'inline') || 'http',
        url: provider.url || '',
        payloadContent: provider.payloadContent || '',
        interval: provider.interval || 86400,
      });
    } else if (open) {
      reset({
        name: '',
        type: 'http',
        url: '',
        payloadContent: '',
        interval: 86400,
      });
    }
  }, [open, provider, reset]);

  const onSubmit = (data: ProviderFormValues) => {
    const namesToCheck = isEditing
      ? existingNames.filter((n) => n !== provider?.name)
      : existingNames;

    if (namesToCheck.includes(data.name)) {
      toast.error('机场名称已存在', {
        description: `名称为"${data.name}"的机场已存在`,
      });
      return;
    }

    if (data.type === 'inline') {
      try {
        parseInlinePayload(data.payloadContent || '');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '节点内容不是有效的 Mihomo YAML');
        return;
      }
    }

    onSave(data as ProxyProviderExtend);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑机场' : '添加机场'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">
              名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="机场名称"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
          </div>
          <div className="grid gap-1.5">
            <Label>类型</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="http" id="type-http" />
                    <Label htmlFor="type-http" className="font-normal cursor-pointer">
                      HTTP
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inline" id="type-inline" />
                    <Label htmlFor="type-inline" className="font-normal cursor-pointer">
                      Inline
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
          {watchType === 'http' && (
            <div className="grid gap-1.5">
              <Label htmlFor="url">
                订阅地址 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="url"
                {...register('url')}
                placeholder="https://example.com/config.yaml"
                className={errors.url ? 'border-destructive' : ''}
              />
              {errors.url && <span className="text-xs text-destructive">{errors.url.message}</span>}
            </div>
          )}
          {watchType === 'inline' && (
            <div className="grid gap-1.5">
              <Label htmlFor="payload">
                节点内容 <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="payload"
                {...register('payloadContent')}
                onPaste={handlePayloadPaste}
                placeholder="输入代理节点YAML...(Base64会自动解码)"
                className={`min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.payloadContent ? 'border-destructive' : 'border-input'}`}
              />
              {errors.payloadContent && (
                <span className="text-xs text-destructive">{errors.payloadContent.message}</span>
              )}
            </div>
          )}
          {watchType === 'http' && (
            <div className="grid gap-1.5">
              <Label htmlFor="interval">
                更新间隔(秒) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="interval"
                type="number"
                {...register('interval')}
                placeholder="86400"
                className={errors.interval ? 'border-destructive' : ''}
              />
              {errors.interval && (
                <span className="text-xs text-destructive">{errors.interval.message}</span>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">{isEditing ? '保存' : '添加'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
