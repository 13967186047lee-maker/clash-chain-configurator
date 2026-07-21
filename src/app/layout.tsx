import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Clash 链式代理配置器 - 代理配置生成工具',
  description:
    '一个纯客户端的 Clash 代理配置生成器，支持多机场订阅合并、代理节点导入、VMess/VLESS/Trojan/SS/Hysteria2 协议解析，数据本地存储，安全可靠。',
  keywords: [
    'Clash',
    'Clash配置',
    'Clash配置生成器',
    '代理配置',
    '机场订阅',
    '订阅合并',
    'VMess',
    'VLESS',
    'Trojan',
    'Shadowsocks',
    'Hysteria2',
    '科学上网',
    '代理工具',
    '节点导入',
    'proxy-provider',
    'Clash Meta',
    'Mihomo',
  ],
  authors: [{ name: '迷雾NEO', url: 'https://x.com/shift_neo' }],
  openGraph: {
    title: 'Clash 链式代理配置器',
    description: '纯客户端 Clash 代理配置生成器，支持多机场订阅合并，数据本地存储',
    type: 'website',
    locale: 'zh_CN',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const themeInitScript = `(function(){var c=document.documentElement.classList;function apply(d){d?c.add('dark'):c.remove('dark');}try{var t=localStorage.getItem('clash-chain-theme');apply(t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches);window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(e){try{if(localStorage.getItem('clash-chain-theme'))return;}catch(err){}apply(e.matches);});}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden`}>
        {/* 首帧渲染前恢复主题，避免明暗闪烁 */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
