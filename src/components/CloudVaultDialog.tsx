'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Cloud,
  Copy,
  Download,
  KeyRound,
  Link2,
  LogIn,
  LogOut,
  Mail,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from './ui/sonner';
import { api } from '@/lib/api-client';
import {
  decryptVault,
  downloadEnvelope,
  encryptVault,
  type EncryptedEnvelope,
  type VaultDocument,
} from '@/lib/vault';

type Session = { authenticated: boolean; user?: { email: string; role: 'user' | 'admin' } };
type AuthMode = 'login' | 'register' | 'reset';

export default function CloudVaultDialog({
  open,
  onOpenChange,
  document,
  configContent,
  canPublish,
  onRestore,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: VaultDocument;
  configContent: string;
  canPublish: boolean;
  onRestore: (document: VaultDocument) => void;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [code, setCode] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [resendSeconds, setResendSeconds] = useState(0);
  const [vaultPassword, setVaultPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [cloud, setCloud] = useState<EncryptedEnvelope | null>(null);
  const [subscriptionPublished, setSubscriptionPublished] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [publishAcknowledged, setPublishAcknowledged] = useState(false);
  const sendCodeLock = useRef(false);

  useEffect(() => {
    if (!resendSeconds) return;
    const timer = window.setInterval(
      () => setResendSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setBusy(false);
    }
  };
  const loadSession = () =>
    run(async () => {
      const current = await api<Session>('/api/auth/session');
      setSession(current);
      if (current.authenticated) {
        const [documentResult, subscriptionResult] = await Promise.all([
          api<{ document: EncryptedEnvelope | null }>('/api/sync/document'),
          api<{ published: boolean }>('/api/sync/subscription'),
        ]);
        setCloud(documentResult.document);
        setSubscriptionPublished(subscriptionResult.published);
        setSubscriptionUrl(
          sessionStorage.getItem(`clash-subscription-url:${current.user?.email}`) || '',
        );
      }
    });

  const authenticate = (mode: 'login' | 'register') =>
    run(async () => {
      await api(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: loginPassword,
          ...(mode === 'register' ? { code } : {}),
        }),
      });
      await loadSession();
      toast.success(mode === 'login' ? '已登录' : '账号已创建');
    });

  const sendCode = (purpose: 'registration' | 'password_reset') => {
    if (sendCodeLock.current) return;
    sendCodeLock.current = true;
    void run(async () => {
      await api('/api/auth/send-code', {
        method: 'POST',
        body: JSON.stringify({ email, purpose }),
      });
      setResendSeconds(60);
      toast.success('验证码已发送，请检查邮箱');
    }).finally(() => {
      sendCodeLock.current = false;
    });
  };

  const resetPassword = () =>
    run(async () => {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, newPassword: loginPassword }),
      });
      setCode('');
      setLoginPassword('');
      setAuthMode('login');
      toast.success('登录密码已重置，请重新登录');
    });

  const save = () =>
    run(async () => {
      const envelope = await encryptVault(document, vaultPassword, cloud || undefined);
      const saved = await api<{ revision: number }>('/api/sync/document', {
        method: 'PUT',
        body: JSON.stringify(envelope),
      });
      setCloud({ ...envelope, revision: saved.revision });
      toast.success('已加密并同步到云端');
    });

  const restore = () =>
    run(async () => {
      if (!cloud) throw new Error('云端还没有配置');
      onRestore(await decryptVault(cloud, vaultPassword));
      toast.success('云端配置已解密到本机');
    });

  const publishSubscription = () =>
    run(async () => {
      if (!canPublish) throw new Error('请先生成一份有效配置');
      const result = await api<{ path: string }>('/api/sync/subscription', {
        method: 'PUT',
        body: JSON.stringify({ content: configContent, acknowledged: publishAcknowledged }),
      });
      const url = new URL(result.path, window.location.origin).toString();
      setSubscriptionUrl(url);
      setSubscriptionPublished(true);
      if (session?.user?.email)
        sessionStorage.setItem(`clash-subscription-url:${session.user.email}`, url);
      toast.success('订阅链接已生成，旧链接已失效');
    });

  const revokeSubscription = () =>
    run(async () => {
      await api('/api/sync/subscription', { method: 'DELETE', body: '{}' });
      if (session?.user?.email)
        sessionStorage.removeItem(`clash-subscription-url:${session.user.email}`);
      setSubscriptionUrl('');
      setSubscriptionPublished(false);
      setPublishAcknowledged(false);
      toast.success('订阅链接已撤销');
    });

  const copySubscription = async () => {
    await navigator.clipboard.writeText(subscriptionUrl);
    toast.success('订阅链接已复制');
  };

  const exportBackup = () =>
    run(async () => downloadEnvelope(await encryptVault(document, vaultPassword)));

  const importBackup = (file: File) =>
    run(async () => {
      const envelope = JSON.parse(await file.text()) as EncryptedEnvelope;
      onRestore(await decryptVault(envelope, vaultPassword));
      toast.success('加密备份已恢复');
    });

  const logout = () =>
    run(async () => {
      await api('/api/auth/logout', { method: 'POST', body: '{}' });
      setSession({ authenticated: false });
      setCloud(null);
      setSubscriptionUrl('');
      setSubscriptionPublished(false);
      setLoginPassword('');
      setVaultPassword('');
      toast.success('已退出，解密密码已从内存清除');
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (value && session === null) void loadSession();
      }}
    >
      <DialogContent className="max-w-[95vw] md:w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            本地与云端保险库
          </DialogTitle>
          <DialogDescription>在纯本地存储、离线加密备份和零知识云同步之间切换。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {session?.authenticated ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span>{session.user?.email}</span>
                <Button variant="ghost" size="sm" onClick={logout} disabled={busy}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出
                </Button>
              </div>
              <div className="grid gap-1.5">
                <Label>保险库密码</Label>
                <Input
                  type="password"
                  value={vaultPassword}
                  onChange={(event) => setVaultPassword(event.target.value)}
                  placeholder="至少 12 个字符；不会发送到服务器"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={save} disabled={busy || vaultPassword.length < 12}>
                  <Upload className="mr-2 h-4 w-4" />
                  加密同步
                </Button>
                <Button variant="outline" onClick={restore} disabled={busy || !cloud}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  恢复云端
                </Button>
              </div>
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2 font-medium">
                  <Link2 className="h-4 w-4" />
                  Clash Verge 订阅链接
                </div>
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
                  发布后，服务器会额外保存一份明文
                  YAML，持有链接的人无需登录即可读取。此副本不属于零知识加密存储。
                </div>
                <label className="flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4"
                    checked={publishAcknowledged}
                    onChange={(event) => setPublishAcknowledged(event.target.checked)}
                  />
                  <span>我理解订阅链接相当于访问密码，并同意服务器保存明文配置。</span>
                </label>
                {subscriptionUrl && (
                  <div className="flex gap-2">
                    <Input readOnly value={subscriptionUrl} className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="icon"
                      title="复制订阅链接"
                      onClick={copySubscription}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {subscriptionPublished && !subscriptionUrl && (
                  <p className="text-xs text-muted-foreground">
                    订阅已发布，但此浏览器没有保存原链接。重新生成后旧链接会立即失效。
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={publishSubscription}
                    disabled={busy || !publishAcknowledged || !canPublish}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {subscriptionPublished ? '重新生成链接' : '发布订阅'}
                  </Button>
                  {subscriptionPublished && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={revokeSubscription}
                      disabled={busy}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      撤销
                    </Button>
                  )}
                </div>
              </div>
              {session.user?.role === 'admin' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => location.assign('/admin')}
                >
                  进入管理后台
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
                <AuthModeButton active={authMode === 'login'} onClick={() => setAuthMode('login')}>
                  登录
                </AuthModeButton>
                <AuthModeButton
                  active={authMode === 'register'}
                  onClick={() => setAuthMode('register')}
                >
                  注册
                </AuthModeButton>
              </div>
              <div className="grid gap-1.5">
                <Label>邮箱</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>{authMode === 'reset' ? '新登录密码' : '登录密码'}</Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="至少 12 个字符"
                />
              </div>
              {authMode !== 'login' && (
                <div className="grid gap-1.5">
                  <Label>邮箱验证码</Label>
                  <div className="flex gap-2">
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                      placeholder="6 位验证码"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      disabled={busy || !email || resendSeconds > 0}
                      onClick={() =>
                        sendCode(authMode === 'register' ? 'registration' : 'password_reset')
                      }
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {resendSeconds ? `${resendSeconds}s` : '发送验证码'}
                    </Button>
                  </div>
                </div>
              )}
              {authMode === 'login' ? (
                <>
                  <Button className="w-full" onClick={() => authenticate('login')} disabled={busy}>
                    <LogIn className="mr-2 h-4 w-4" />
                    登录
                  </Button>
                  <button
                    type="button"
                    className="mx-auto text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    onClick={() => setAuthMode('reset')}
                  >
                    忘记登录密码？
                  </button>
                </>
              ) : authMode === 'register' ? (
                <Button
                  className="w-full"
                  onClick={() => authenticate('register')}
                  disabled={busy || code.length !== 6 || loginPassword.length < 12}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  验证邮箱并注册
                </Button>
              ) : (
                <>
                  <Button
                    className="w-full"
                    onClick={resetPassword}
                    disabled={busy || code.length !== 6 || loginPassword.length < 12}
                  >
                    <KeyRound className="mr-2 h-4 w-4" />
                    重置登录密码
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    邮件找回只会重置登录密码，不会改变或恢复保险库密码。
                  </p>
                  <button
                    type="button"
                    className="mx-auto text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    onClick={() => setAuthMode('login')}
                  >
                    返回登录
                  </button>
                </>
              )}
            </>
          )}
          <div className="border-t pt-4">
            <div className="grid gap-1.5">
              <Label>离线加密备份密码</Label>
              <Input
                type="password"
                value={vaultPassword}
                onChange={(event) => setVaultPassword(event.target.value)}
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={exportBackup}
                disabled={busy || vaultPassword.length < 12}
              >
                <Download className="mr-2 h-4 w-4" />
                导出备份
              </Button>
              <Button variant="outline" asChild>
                <label>
                  <Upload className="mr-2 h-4 w-4" />
                  导入备份
                  <input
                    className="hidden"
                    type="file"
                    accept="application/json"
                    onChange={(event) =>
                      event.target.files?.[0] && importBackup(event.target.files[0])
                    }
                  />
                </label>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuthModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1.5 text-sm ${active ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}
