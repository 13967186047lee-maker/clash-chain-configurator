'use client';

export function csrfToken() {
  return (
    document.cookie
      .split('; ')
      .find((part) => part.startsWith('csrf-token='))
      ?.split('=')[1] || ''
  );
}

export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.method && init.method !== 'GET' ? { 'x-csrf-token': csrfToken() } : {}),
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '请求失败');
  return data as T;
}
