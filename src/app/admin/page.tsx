'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ban, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

type UserRow = {
  id: string;
  email: string;
  role: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt: string | null;
  quotaBytes: number;
  storageBytes: number;
  deviceCount: number;
};
type AuditRow = {
  id: string;
  action: string;
  actorUserId: string | null;
  targetUserId: string | null;
  createdAt: string;
};
type Usage = { totalUsers: number; activeUsers: number; totalStorageBytes: number };

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [userData, logData, usageData] = await Promise.all([
        api<{ users: UserRow[] }>('/api/admin/users'),
        api<{ auditLogs: AuditRow[] }>('/api/admin/audit-logs'),
        api<Usage>('/api/admin/usage'),
      ]);
      setUsers(userData.users);
      setLogs(logData.auditLogs);
      setUsage(usageData);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '无法加载后台');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (user: UserRow) => {
    await api(`/api/admin/users/${user.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: user.status === 'active' ? 'disabled' : 'active' }),
    });
    await load();
  };

  const remove = async (user: UserRow) => {
    if (!confirm(`确定删除 ${user.email} 及其全部密文吗？此操作不可恢复。`)) return;
    await api(`/api/admin/users/${user.id}/status`, { method: 'DELETE', body: '{}' });
    await load();
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">管理后台</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">返回配置器</Link>
            </Button>
          </div>
        </div>
      </header>
      <div className="container mx-auto space-y-8 px-4 py-6">
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive">
            {error}
          </div>
        )}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric label="用户总数" value={usage?.totalUsers ?? '-'} />
          <Metric label="活跃用户" value={usage?.activeUsers ?? '-'} />
          <Metric label="密文存储" value={usage ? formatBytes(usage.totalStorageBytes) : '-'} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">用户</h2>
          <div className="overflow-x-auto rounded-md border bg-background">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="p-3">用户</th>
                  <th>状态</th>
                  <th>存储</th>
                  <th>设备</th>
                  <th>最后登录</th>
                  <th className="pr-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div>{user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.role}</div>
                    </td>
                    <td>{user.status === 'active' ? '正常' : '已禁用'}</td>
                    <td>
                      {formatBytes(Number(user.storageBytes))} /{' '}
                      {formatBytes(Number(user.quotaBytes))}
                    </td>
                    <td>{user.deviceCount}</td>
                    <td>
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '从未'}
                    </td>
                    <td className="pr-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={user.status === 'active' ? '禁用' : '启用'}
                        onClick={() => setStatus(user)}
                      >
                        {user.status === 'active' ? (
                          <Ban className="h-4 w-4" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        title="删除"
                        onClick={() => remove(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">审计日志</h2>
          <div className="rounded-md border bg-background">
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="grid gap-1 p-3 text-sm sm:grid-cols-[220px_1fr_1fr]">
                  <span>{new Date(log.createdAt).toLocaleString()}</span>
                  <span>{log.action}</span>
                  <span className="truncate text-muted-foreground">
                    目标：{log.targetUserId || '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}
