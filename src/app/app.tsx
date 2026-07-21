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
import StatsOverview from '@/components/StatsOverview';
import SectionPanel from '@/components/SectionPanel';
import ThemeToggle from '@/components/ThemeToggle';
import { ConfigStatusBadge, getConfigStatus } from '@/components/config-status';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import {
  Cloud,
  Copy,
  Download,
  FileText,
  Import,
  Plus,
  Satellite,
  Server,
  XCircle,
} from 'lucide-react';
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
  const configStatus = getConfigStatus(configErrors, providers.length);

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
    <div className="relative min-h-screen bg-background">
      {/* 点状网格背景纹理 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(79,70,229,0.07)_1px,transparent_1px)] bg-[size:22px_22px] dark:bg-[radial-gradient(rgba(165,180,252,0.06)_1px,transparent_1px)]" />
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/clash-proxy-logo.png"
              alt="Clash 链式代理配置器"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-lg"
              priority
            />
            <span className="truncate text-base font-bold tracking-tight">
              Clash 链式代理配置器
            </span>
            <span className="hidden shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary md:inline">
              本地优先 · 端到端加密
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            <Button size="sm" onClick={() => setCloudDialogOpen(true)}>
              <Cloud className="h-4 w-4" />
              <span className="hidden sm:inline">云端保险库</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container relative mx-auto max-w-6xl px-4 pb-16">
        <section className="py-8 sm:py-10">
          <h1 className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400 sm:text-4xl">
            链式代理，可视化编排
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            合并机场订阅、编排落地节点与 dialer-proxy 链式关系，实时生成可导入 Clash Verge 的 Mihomo
            配置。
          </p>
        </section>

        <StatsOverview
          providers={providers}
          proxyNodes={proxyNodes}
          status={configStatus}
          errorCount={configErrors.length}
        />

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1fr_400px]">
          <div className="space-y-5">
            <SectionPanel
              icon={Satellite}
              title="机场列表"
              count={providers.length}
              iconTint="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              actions={
                <Button onClick={handleAddProvider} size="sm">
                  <Plus className="h-4 w-4" /> 添加
                </Button>
              }
            >
              <ProviderList
                providers={providers}
                onRemove={handleRemoveProvider}
                onEdit={handleEditProvider}
                onAdd={handleAddProvider}
              />
            </SectionPanel>

            <SectionPanel
              icon={Server}
              title="落地节点"
              count={proxyNodes.length}
              iconTint="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              actions={
                <>
                  <Button onClick={() => setImportDialogOpen(true)} variant="outline" size="sm">
                    <Import className="h-4 w-4" />
                    <span className="hidden sm:inline">导入</span>
                  </Button>
                  <Button onClick={handleAddProxyNode} size="sm">
                    <Plus className="h-4 w-4" /> 添加
                  </Button>
                </>
              }
            >
              <FinalProxyNodeList
                proxyNodes={proxyNodes}
                onRemove={handleRemoveProxyNode}
                onEdit={handleEditProxyNode}
                onAdd={handleAddProxyNode}
              />
            </SectionPanel>
          </div>

          <aside className="lg:sticky lg:top-[4.5rem]">
            <SectionPanel
              icon={FileText}
              title="实时预览"
              iconTint="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              className="overflow-hidden"
              actions={
                <>
                  <ConfigStatusBadge status={configStatus} errorCount={configErrors.length} />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopyConfig}
                    title="复制配置"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleDownloadConfig}
                    title="下载 clash-config.yaml"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              }
            >
              {configErrors.length > 0 && (
                <div className="space-y-1 border-b border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                  {configErrors.map((error) => (
                    <div key={error} className="flex items-start gap-1.5">
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
              <SyntaxHighlighter
                language="yaml"
                style={oneDark}
                showLineNumbers
                customStyle={{ fontSize: '0.75rem', margin: 0, minHeight: '16rem' }}
                className="!h-[380px] overflow-auto sm:!h-[440px]"
              >
                {configStatus === 'ok'
                  ? content
                  : configErrors.length
                    ? '# 请先修复配置错误。'
                    : '# 请添加至少一个机场以生成配置。'}
              </SyntaxHighlighter>
            </SectionPanel>
          </aside>
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          配置仅保存在当前浏览器 · 云端保险库使用端到端加密，服务器无法读取内容
        </footer>
      </div>

      <ProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        provider={editingIndex !== null ? providers[editingIndex] : null}
        onSave={handleSaveProvider}
        existingNames={providers.map((p) => p.name)}
      />
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
        canPublish={configStatus === 'ok'}
        onRestore={(document) => {
          setProviders(document.providers);
          setProxyNodes(document.proxyNodes);
        }}
      />
      <Toaster />
    </div>
  );
}
