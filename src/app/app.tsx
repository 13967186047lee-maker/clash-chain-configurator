import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { buildMihomoConfig } from '@/lib/mihomo';
import ProviderList from '@/components/ProviderList';
import ProviderDialog from '@/components/ProviderDialog';
import FinalProxyNodeList from '@/components/FinalProxyNodeList';
import FinalProxyNodeDialog from '@/components/FinalProxyNodeDialog';
import ImportProxyNodesDialog from '@/components/ImportProxyNodesDialog';
import CloudVaultDialog from '@/components/CloudVaultDialog';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { Plus, Import, Copy, Download, Cloud } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const STORAGE_KEYS = {
  PROVIDERS: 'clash-chain-providers',
  PROXY_NODES: 'clash-chain-proxy-nodes',
};

export default function App() {
  const [providers, setProviders] = useState<ProxyProviderExtend[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [proxyNodes, setProxyNodes] = useState<ProxyNode[]>([]);
  const [proxyNodeDialogOpen, setProxyNodeDialogOpen] = useState(false);
  const [editingProxyNodeIndex, setEditingProxyNodeIndex] = useState<number | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [cloudDialogOpen, setCloudDialogOpen] = useState(false);
  const hydrated = useRef(false);

  const configResult = useMemo(
    () => buildMihomoConfig({ providers, proxyNodes }),
    [providers, proxyNodes],
  );
  const { content, errors: configErrors } = configResult;

  useEffect(() => {
    try {
      const savedProviders = localStorage.getItem(STORAGE_KEYS.PROVIDERS);
      const savedProxyNodes = localStorage.getItem(STORAGE_KEYS.PROXY_NODES);
      if (savedProviders) {
        setProviders(JSON.parse(savedProviders));
      }
      if (savedProxyNodes) {
        setProxyNodes(JSON.parse(savedProxyNodes));
      }
      hydrated.current = true;
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      hydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
      localStorage.setItem(STORAGE_KEYS.PROXY_NODES, JSON.stringify(proxyNodes));
    } catch (e) {
      console.error('Failed to save configuration to localStorage:', e);
    }
  }, [providers, proxyNodes]);

  const handleRemoveProvider = useCallback((index: number) => {
    setProviders((current) => current.filter((_, i) => i !== index));
  }, []);

  const handleEditProvider = useCallback((index: number) => {
    setEditingIndex(index);
    setDialogOpen(true);
  }, []);

  const handleAddProvider = useCallback(() => {
    setEditingIndex(null);
    setDialogOpen(true);
  }, []);

  const handleSaveProvider = useCallback(
    (provider: ProxyProviderExtend) => {
      setProviders((current) => {
        if (editingIndex !== null) {
          const next = [...current];
          next[editingIndex] = provider;
          return next;
        }
        return [...current, provider];
      });
    },
    [editingIndex],
  );

  const handleRemoveProxyNode = useCallback((index: number) => {
    setProxyNodes((current) => current.filter((_, i) => i !== index));
  }, []);

  const handleEditProxyNode = useCallback((index: number) => {
    setEditingProxyNodeIndex(index);
    setProxyNodeDialogOpen(true);
  }, []);

  const handleAddProxyNode = useCallback(() => {
    setEditingProxyNodeIndex(null);
    setProxyNodeDialogOpen(true);
  }, []);

  const handleSaveProxyNode = useCallback(
    (proxyNode: ProxyNode) => {
      setProxyNodes((current) => {
        if (editingProxyNodeIndex !== null) {
          const next = [...current];
          next[editingProxyNodeIndex] = proxyNode;
          return next;
        }
        return [...current, proxyNode];
      });
    },
    [editingProxyNodeIndex],
  );

  const handleImportProxyNodes = useCallback((nodes: ProxyNode[]) => {
    setProxyNodes((current) => [...current, ...nodes]);
  }, []);

  const handleCopyConfig = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  };

  const handleDownloadConfig = () => {
    const blob = new Blob([content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clash-config.yaml';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('配置已下载');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold">Clash 链式代理配置器</h1>
          <Button variant="outline" size="sm" onClick={() => setCloudDialogOpen(true)}>
            <Cloud className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">云端保险库</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 pt-16 sm:pt-20 pb-4 space-y-4 sm:space-y-8">
        <div className="flex justify-center">
          <Image
            src="/clash-proxy-logo.png"
            alt="Clash 链式代理配置器"
            width={200}
            height={200}
            className="w-32 h-32 sm:w-48 sm:h-48 md:w-[200px] md:h-[200px]"
            priority
          />
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">机场列表</h2>
            <Button onClick={handleAddProvider} size="sm" className="sm:size-default">
              <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">添加</span>
            </Button>
          </div>
          <ProviderList
            providers={providers}
            onRemove={handleRemoveProvider}
            onEdit={handleEditProvider}
          />
        </div>

        <ProviderDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          provider={editingIndex !== null ? providers[editingIndex] : null}
          onSave={handleSaveProvider}
          existingNames={providers.map((p) => p.name)}
        />

        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">落地节点</h2>
            <div className="flex gap-1 sm:gap-2">
              <Button
                onClick={() => setImportDialogOpen(true)}
                variant="outline"
                size="sm"
                className="sm:size-default"
              >
                <Import className="h-4 w-4 sm:mr-2" />{' '}
                <span className="hidden sm:inline">导入</span>
              </Button>
              <Button onClick={handleAddProxyNode} size="sm" className="sm:size-default">
                <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">添加</span>
              </Button>
            </div>
          </div>
          <FinalProxyNodeList
            proxyNodes={proxyNodes}
            onRemove={handleRemoveProxyNode}
            onEdit={handleEditProxyNode}
          />
        </div>

        <FinalProxyNodeDialog
          open={proxyNodeDialogOpen}
          onOpenChange={setProxyNodeDialogOpen}
          proxyNode={editingProxyNodeIndex !== null ? proxyNodes[editingProxyNodeIndex] : null}
          onSave={handleSaveProxyNode}
          existingNames={proxyNodes.map((p) => p.name)}
        />

        <ImportProxyNodesDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={handleImportProxyNodes}
          existingNames={proxyNodes.map((p) => p.name)}
        />

        <CloudVaultDialog
          open={cloudDialogOpen}
          onOpenChange={setCloudDialogOpen}
          document={{ providers, proxyNodes }}
          configContent={content}
          canPublish={providers.length > 0 && configErrors.length === 0}
          onRestore={(document) => {
            setProviders(document.providers);
            setProxyNodes(document.proxyNodes);
          }}
        />

        <Toaster />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">生成的配置</h2>
            <div className="flex gap-1 sm:gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyConfig}>
                <Copy className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">复制</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadConfig}>
                <Download className="h-4 w-4 sm:mr-2" />{' '}
                <span className="hidden sm:inline">下载</span>
              </Button>
            </div>
          </div>
          {configErrors.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {configErrors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}
          <div className="overflow-hidden rounded-lg">
            <SyntaxHighlighter
              language="yaml"
              style={oneDark}
              showLineNumbers
              customStyle={{ borderRadius: '0.5rem', fontSize: '0.75rem', margin: 0 }}
              className="!h-[240px] sm:!h-[300px] text-xs sm:text-sm overflow-auto"
            >
              {providers.length > 0 && configErrors.length === 0
                ? content
                : configErrors.length
                  ? '请先修复上方配置错误。'
                  : '请添加至少一个机场以生成配置。'}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </>
  );
}
