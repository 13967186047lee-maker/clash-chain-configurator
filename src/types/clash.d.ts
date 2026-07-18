interface HttpProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 http */
  type: 'http';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** [可选] 用户名 (用于需要认证的代理) */
  username?: string;

  /** [可选] 密码 (用于需要认证的代理) */
  password?: string;

  /** [可选] 是否启用 TLS，即使用 HTTPS 代理。默认为 false (HTTP) */
  tls?: boolean;

  /** [可选] 是否跳过证书验证。只在 tls: true 时有效 */
  'skip-cert-verify'?: boolean;

  /** [可选] SNI (Server Name Indication) 设置。只在 tls: true 时有效 */
  sni?: string;

  /** * [可选] TLS 指纹 (SHA256)。只在 tls: true 时有效。
   * 配置协议独立的指纹，将忽略 experimental.fingerprints。
   */
  fingerprint?: string;

  /** [可选] IP 版本，如 'dual' */
  'ip-version'?: 'dual' | 'ipv4' | 'ipv6';

  /** [可选] 自定义 HTTP 头部。例如 User-Agent 或 Authorization */
  headers?: {
    [key: string]: string;
  };
}

interface Socks5ProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 socks5 */
  type: 'socks5';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** [可选] 用户名 (用于需要认证的代理) */
  username?: string;

  /** [可选] 密码 (用于需要认证的代理) */
  password?: string;

  /** [可选] 是否启用 TLS，即使用 SOCKS5 over TLS。默认为 false */
  tls?: boolean;

  /** [可选] 是否支持 UDP 转发。默认为 false */
  udp?: boolean;

  /** [可选] 是否跳过证书验证。只在 tls: true 时有效 */
  'skip-cert-verify'?: boolean;

  /** [可选] TLS 指纹 (SHA256)。只在 tls: true 时有效。 */
  fingerprint?: string;

  /** [可选] IP 版本，如 'ipv6' */
  'ip-version'?: 'dual' | 'ipv4' | 'ipv6';
}

/**
 * Clash Shadowsocks (SS) 代理节点配置
 */
interface ShadowsocksProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 ss */
  type: 'ss';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** 加密方式 (Cipher)，例如 aes-128-gcm, chacha20-poly1305 等 */
  cipher: string;

  /** 连接密码 */
  password: string;

  /** [可选] 是否启用 UDP 转发。默认为 false */
  udp?: boolean;

  /** [可选] 是否将 UDP 流量封装在 TCP 中 (UDP over TCP)。默认为 false */
  'udp-over-tcp'?: boolean;

  /** [可选] UDP over TCP 的版本。默认为 2 */
  'udp-over-tcp-version'?: number;

  /** [可选] IP 版本，如 'ipv4' */
  'ip-version'?: 'dual' | 'ipv4' | 'ipv6';

  /** [可选] 混淆插件类型 (Plugin Type)，如 obfs, v2ray-plugin 等 */
  plugin?: string;

  /** [可选] 混淆插件的配置选项 */
  'plugin-opts'?: {
    /** 混淆模式 (mode)，例如 tls, http */
    mode?: string;
    /** [允许其他自定义插件选项] */
    [key: string]: any;
  };

  /** [可选] SMUX (Stream Multiplexing) 流多路复用配置 */
  smux?: {
    /** 是否启用 SMUX。默认为 false */
    enabled?: boolean;
    /** [允许其他自定义 SMUX 选项] */
    [key: string]: any;
  };

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash ShadowsocksR (SSR) 代理节点配置
 */
interface ShadowsocksRProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 ssr */
  type: 'ssr';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** 加密方式 (Cipher)，例如 chacha20-ietf, aes-256-cfb 等 */
  cipher: string;

  /** 连接密码 */
  password: string;

  /** 混淆方式 (Obfuscation)，例如 plain, tls1.2_ticket_auth 等 */
  obfs: string;

  /** 协议 (Protocol)，例如 origin, auth_sha1_v4 等 */
  protocol: string;

  /** [可选] 混淆参数 (Obfuscation Parameter) */
  'obfs-param'?: string;

  /** [可选] 协议参数 (Protocol Parameter) */
  'protocol-param'?: string;

  /** [可选] 是否启用 UDP 转发。默认为 false */
  udp?: boolean;

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash Snell 代理节点配置
 */
interface SnellProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 snell */
  type: 'snell';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** 预共享密钥 (Pre-Shared Key) */
  psk: string;

  /** [可选] Snell 协议版本。默认为 1 */
  version?: 1 | 2 | 3 | number;

  /** [可选] 混淆配置选项 */
  'obfs-opts'?: {
    /** 混淆模式 (mode)，例如 tls, http */
    mode?: 'tls' | 'http' | string;

    /** 混淆目标主机名 */
    host?: string;

    /** [允许其他自定义混淆选项] */
    [key: string]: any;
  };

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash Vmess 代理节点配置
 */
interface VmessProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 vmess */
  type: 'vmess';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** Vmess 用户 ID (UUID) */
  uuid: string;

  /** 额外 ID (AlterId) */
  alterId: number;

  /** 加密方式 (Cipher)，通常设置为 auto */
  cipher: string;

  /** [可选] 是否启用 UDP 转发。默认为 false */
  udp?: boolean;

  /** [可选] Vmess 数据包编码方式 */
  'packet-encoding'?: 'auto' | 'xudp' | 'packetaddr';

  /** [可选] 是否启用全局填充 */
  'global-padding'?: boolean;

  /** [可选] 是否启用认证长度字段 */
  'authenticated-length'?: boolean;

  // --- TLS/Reality 配置 ---

  /** [可选] 是否启用 TLS 加密 */
  tls?: boolean;

  /** [可选] 服务器名称 (SNI)。在 tls: true 时推荐设置 */
  servername?: string;

  /** [可选] TLS 应用层协议协商 (ALPN) 列表 */
  alpn?: string[];

  /** [可选] TLS 指纹 (SHA256) */
  fingerprint?: string;

  /** [可选] 客户端 TLS 指纹，用于伪装客户端类型 (例如 'chrome', 'firefox') */
  'client-fingerprint'?: string;

  /** [可选] 是否跳过证书验证。在 tls: true 时有效 */
  'skip-cert-verify'?: boolean;

  /** [可选] Reality 配置选项，用于 Vless/Vmess with XTLS-Vision */
  'reality-opts'?: {
    /** 服务器公钥 */
    'public-key': string;
    /** 短 ID */
    'short-id': string;
    /** [允许其他自定义 Reality 选项] */
    [key: string]: any;
  };

  // --- 网络配置 ---

  /** [可选] 传输协议类型 */
  network?: 'tcp' | 'ws' | 'h2' | 'quic' | 'grpc' | string;

  /** [可选] TCP 传输协议的配置选项 (network: tcp 时) */
  'tcp-opts'?: {
    // 例如：
    'header-type'?: 'none' | 'http';
    request?: { [key: string]: any };
    response?: { [key: string]: any };
    [key: string]: any;
  };

  /** [可选] WebSocket 传输协议的配置选项 (network: ws 时) */
  'ws-opts'?: {
    path?: string;
    headers?: {
      Host?: string;
      [key: string]: string | undefined;
    };
    [key: string]: any;
  };

  // --- SMUX (Stream Multiplexing) 配置 ---

  /** [可选] SMUX (Stream Multiplexing) 流多路复用配置 */
  smux?: {
    /** 是否启用 SMUX。默认为 false */
    enabled?: boolean;
    /** [允许其他自定义 SMUX 选项] */
    [key: string]: any;
  };

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash VLESS 代理节点配置
 */
interface VlessProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 vless */
  type: 'vless';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** VLESS 用户 ID (UUID) */
  uuid: string;

  /** [可选] 是否启用 UDP 转发。默认为 false */
  udp?: boolean;

  /** [可选] XTLS 流量控制方式。例如：xtls-rprx-vision, xtls-rprx-direct 等 */
  flow?: 'xtls-rprx-vision' | 'xtls-rprx-direct' | string;

  /** [可选] VLESS 数据包编码方式 */
  'packet-encoding'?: 'none' | 'xudp';

  /** VLESS 节点的加密方式。VLESS 协议规范要求此字段为空字符串 "" */
  encryption: '';

  // --- TLS/Reality 配置 ---

  /** [可选] 是否启用 TLS 加密 */
  tls?: boolean;

  /** [可选] 服务器名称 (SNI)。在 tls: true 时推荐设置 */
  servername?: string;

  /** [可选] TLS 应用层协议协商 (ALPN) 列表 */
  alpn?: string[];

  /** [可选] TLS 指纹 (SHA256) */
  fingerprint?: string;

  /** [可选] 客户端 TLS 指纹，用于伪装客户端类型 (例如 'chrome', 'firefox') */
  'client-fingerprint'?: string;

  /** [可选] 是否跳过证书验证。在 tls: true 时有效 */
  'skip-cert-verify'?: boolean;

  /** [可选] Reality 配置选项，用于 Vless with Reality */
  'reality-opts'?: {
    /** 服务器公钥 */
    'public-key': string;
    /** 短 ID */
    'short-id': string;
    /** [允许其他自定义 Reality 选项] */
    [key: string]: any;
  };

  // --- 网络配置 ---

  /** [可选] 传输协议类型 */
  network?: 'tcp' | 'ws' | 'h2' | 'quic' | 'grpc' | string;

  /** [可选] TCP 传输协议的配置选项 (network: tcp 时) */
  'tcp-opts'?: {
    // 例如：
    'header-type'?: 'none' | 'http';
    request?: { [key: string]: any };
    response?: { [key: string]: any };
    [key: string]: any;
  };

  /** [可选] WebSocket 传输协议的配置选项 (network: ws 时) */
  'ws-opts'?: {
    path?: string;
    headers?: {
      Host?: string;
      [key: string]: string | undefined;
    };
    [key: string]: any;
  };

  // --- SMUX (Stream Multiplexing) 配置 ---

  /** [可选] SMUX (Stream Multiplexing) 流多路复用配置 */
  smux?: {
    /** 是否启用 SMUX。默认为 false */
    enabled?: boolean;
    /** [允许其他自定义 SMUX 选项] */
    [key: string]: any;
  };

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash Trojan 代理节点配置
 */
interface TrojanProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 trojan */
  type: 'trojan';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** Trojan 密码 (Password) */
  password: string;

  /** [可选] 是否启用 UDP 转发。默认为 false */
  udp?: boolean;

  // --- TLS/Reality 配置 ---

  /** [可选] 服务器名称指示 (SNI) */
  sni?: string;

  /** [可选] TLS 应用层协议协商 (ALPN) 列表 */
  alpn?: string[];

  /** [可选] 客户端 TLS 指纹，用于伪装客户端类型 (例如 'chrome', 'random') */
  'client-fingerprint'?: string;

  /** [可选] TLS 指纹 (SHA256) */
  fingerprint?: string;

  /** [可选] 是否跳过证书验证。默认为 false */
  'skip-cert-verify'?: boolean;

  /** [可选] ShadowSocks over Trojan 配置选项 */
  'ss-opts'?: {
    /** 是否启用 SS 封装。默认为 false */
    enabled?: boolean;
    /** SS 加密方法 */
    method?: string;
    /** SS 密码 */
    password?: string;
    [key: string]: any;
  };

  /** [可选] Reality 配置选项，用于 Trojan with Reality */
  'reality-opts'?: {
    /** 服务器公钥 */
    'public-key': string;
    /** 短 ID */
    'short-id': string;
    /** [允许其他自定义 Reality 选项] */
    [key: string]: any;
  };

  // --- 网络配置 ---

  /** [可选] 传输协议类型 */
  network?: 'tcp' | 'ws' | 'h2' | 'grpc' | string;

  /** [可选] WebSocket 传输协议的配置选项 (network: ws 时) */
  'ws-opts'?: {
    path?: string;
    headers?: {
      Host?: string;
      [key: string]: string | undefined;
    };
    [key: string]: any;
  };

  // --- SMUX (Stream Multiplexing) 配置 ---

  /** [可选] SMUX (Stream Multiplexing) 流多路复用配置 */
  smux?: {
    /** 是否启用 SMUX。默认为 false */
    enabled?: boolean;
    /** [允许其他自定义 SMUX 选项] */
    [key: string]: any;
  };

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash AnyTLS 代理节点配置
 */
interface AnyTlsProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 anytls */
  type: 'anytls';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** 认证密码 */
  password: string;

  /** [可选] 客户端 TLS 指纹，用于伪装客户端类型 (例如 'chrome', 'firefox', 'random') */
  'client-fingerprint'?: string;

  /** [可选] 是否启用 UDP 转发。默认为 false */
  udp?: boolean;

  // --- 会话管理配置 ---

  /** [可选] 检查空闲会话的间隔时间 (秒) */
  'idle-session-check-interval'?: number;

  /** [可选] 空闲会话的超时时间 (秒)，超过此时间会话将被关闭 */
  'idle-session-timeout'?: number;

  /** [可选] 最小保持空闲的会话数量 */
  'min-idle-session'?: number;

  // --- TLS 配置 ---

  /** [可选] 服务器名称指示 (SNI) */
  sni?: string;

  /** [可选] TLS 应用层协议协商 (ALPN) 列表 */
  alpn?: string[];

  /** [可选] 是否跳过证书验证。默认为 false */
  'skip-cert-verify'?: boolean;

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash Mieru 代理节点配置
 */
interface MieruProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 mieru */
  type: 'mieru';

  /** 服务器地址/域名 */
  server: string;

  /** 主端口号 */
  port: number;

  /** [可选] 额外的端口范围，例如 "2090-2099" */
  'port-range'?: string;

  /** [可选] 传输协议类型 */
  transport?: 'TCP' | 'UDP' | 'KCP' | string;

  /** [可选] 用户名 */
  username?: string;

  /** [可选] 密码 */
  password?: string;

  /** [可选] 多路复用模式 */
  multiplexing?: 'MULTIPLEXING_LOW' | 'MULTIPLEXING_HIGH' | string;

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash Sudoku 代理节点配置
 */
interface SudokuProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 sudoku */
  type: 'sudoku';

  /** 服务器地址 */
  server: string;

  /** 端口号 */
  port: number;

  /** 客户端密钥 (Key) */
  key: string;

  /** [可选] AEAD 加密方法 */
  'aead-method'?: 'chacha20-poly1305' | 'aes-128-gcm' | 'aes-256-gcm' | string;

  /** [可选] 最小填充字节数 */
  'padding-min'?: number;

  /** [可选] 最大填充字节数 */
  'padding-max'?: number;

  /** [可选] 混淆表类型 */
  'table-type'?: 'prefer_ascii' | 'prefer_hex' | 'full' | string;

  /** [可选] 是否启用 HTTP 伪装 (HTTP Masking) */
  'http-mask'?: boolean;

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash Hysteria 代理节点配置
 */
interface HysteriaProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 hysteria */
  type: 'hysteria';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** [可选] 端口号列表或范围。例如 "1000,2000-3000,4000" */
  ports?: string;

  /** 认证字符串/密码 */
  'auth-str': string;

  /** [可选] 混淆字符串 (Obfuscation String) */
  obfs?: string;

  /** [可选] 应用层协议协商 (ALPN) 列表 */
  alpn?: string[];

  /** [可选] 传输协议。支持 udp/wechat-video/faketcp */
  protocol?: 'udp' | 'wechat-video' | 'faketcp' | string;

  /** [可选] 上行带宽限制 (Upload Bandwidth) */
  up?: string;

  /** [可选] 下行带宽限制 (Download Bandwidth) */
  down?: string;

  /** [可选] 服务器名称指示 (SNI)。用于 TLS 握手 */
  sni?: string;

  /** [可选] 是否跳过证书验证。默认为 false */
  'skip-cert-verify'?: boolean;

  /** [可选] 接收窗口大小 (连接级别，字节)。默认值较大 */
  'recv-window-conn'?: number;

  /** [可选] 接收窗口大小 (字节)。默认值较大 */
  'recv-window'?: number;

  /** [可选] 是否禁用 MTU 发现 */
  disable_mtu_discovery?: boolean;

  /** [可选] TLS 指纹 (SHA256)。实现 SSL Pining */
  fingerprint?: string;

  /** [可选] 是否启用 Fast Open。默认为 false */
  'fast-open'?: boolean;

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash Hysteria 2 代理节点配置
 */
interface Hysteria2ProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 hysteria2 */
  type: 'hysteria2';

  /** 服务器地址/域名 */
  server: string;

  /** 主端口号 */
  port: number;

  /** [可选] 端口号或范围。例如 "443-8443" */
  ports?: string;

  /** 认证密码 */
  password: string;

  /** [可选] 上行带宽限制 (Upload Bandwidth)。若不写单位,默认为 Mbps */
  up?: string;

  /** [可选] 下行带宽限制 (Download Bandwidth)。若不写单位,默认为 Mbps */
  down?: string;

  /** [可选] 混淆类型。目前仅支持 salamander */
  obfs?: 'salamander' | string;

  /** [可选] 混淆密码。仅在 obfs 启用时使用 */
  'obfs-password'?: string;

  // --- TLS 配置 ---

  /** [可选] 服务器名称指示 (SNI)。用于 TLS 握手 */
  sni?: string;

  /** [可选] 是否跳过证书验证。默认为 false */
  'skip-cert-verify'?: boolean;

  /** [可选] TLS 指纹 (SHA256)。实现 SSL Pining */
  fingerprint?: string;

  /** [可选] 应用层协议协商 (ALPN) 列表 */
  alpn?: string[];

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash TUIC 代理节点配置
 */
interface TuicProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 tuic */
  type: 'tuic';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** 认证 Token (Clash 使用) */
  token: string;

  /** 用户 ID (UUID) */
  uuid: string;

  /** 密码。请注意，Clash 核心通常只使用 uuid/token 或 password/token 中的一个进行认证 */
  password?: string;

  /** [可选] 直接连接的 IP 地址，跳过 DNS 解析 */
  ip?: string;

  /** [可选] 心跳间隔时间 (毫秒) */
  'heartbeat-interval'?: number;

  /** [可选] 应用层协议协商 (ALPN) 列表，例如 [h3] */
  alpn?: string[];

  /** [可选] 是否禁用 SNI (Server Name Indication) */
  'disable-sni'?: boolean;

  /** [可选] 是否启用 Reduce RTT (减少往返时间) 优化 */
  'reduce-rtt'?: boolean;

  /** [可选] 请求超时时间 (毫秒) */
  'request-timeout'?: number;

  /** [可选] UDP 转发模式 */
  'udp-relay-mode'?: 'native' | 'quic';

  /** [可选] 拥塞控制算法 */
  'congestion-controller'?: 'bbr' | 'cubic' | 'newreno' | string;

  /** [可选] UDP 转发最大包大小 */
  'max-udp-relay-packet-size'?: number;

  /** [可选] 是否启用 Fast Open */
  'fast-open'?: boolean;

  /** [可选] 是否跳过证书验证 */
  'skip-cert-verify'?: boolean;

  /** [可选] 最大并发流数 */
  'max-open-streams'?: number;

  /** [可选] 强制指定的 SNI，如果 'disable-sni' 为 false */
  sni?: string;

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash WireGuard (wg) 代理节点配置
 */
interface WireGuardProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 wireguard */
  type: 'wireguard';

  /** 客户端私钥 (Private Key) */
  'private-key': string;

  /** 服务器地址/域名 */
  server: string;

  /** 端口号 */
  port: number;

  /** 客户端在 WireGuard 虚拟网络中的 IPv4 地址 */
  ip: string;

  /** [可选] 客户端在 WireGuard 虚拟网络中的 IPv6 地址 */
  ipv6?: string;

  /** 对端/服务器公钥 (Public Key) */
  'public-key': string;

  /** 允许通过此连接发送流量的目标 IP 范围 (路由规则) */
  'allowed-ips': string[];

  /** [可选] 预共享密钥 (Pre-Shared Key)，用于额外的密钥层 */
  'pre-shared-key'?: string;

  /** [可选] 保留字段，一个包含 3 个字节的数组或 Base64 字符串 */
  reserved?: number[] | string;

  /** [可选] 是否启用 UDP 转发。默认为 false */
  udp?: boolean;

  /** [可选] 最大传输单元 (MTU) */
  mtu?: number;

  /** [可选] 一个出站代理的标识。当值不为空时，将使用指定的 proxy/proxy-group 发出连接 */
  'dialer-proxy'?: string;

  /** [可选] 强制 DNS 远程解析，默认值为 false */
  'remote-dns-resolve'?: boolean;

  /** [可选] DNS 服务器列表。仅在 remote-dns-resolve 为 true 时生效 */
  dns?: string[];

  /** [可选] AmneziaWG 配置选项，用于增强型 WireGuard 功能 */
  'amnezia-wg-option'?: {
    /** 握手重传计数器阈值 */
    jc?: number;
    /** 最小握手间隔 (毫秒) */
    jmin?: number;
    /** 最大握手间隔 (毫秒) */
    jmax?: number;
    /** S1 参数 */
    s1?: number;
    /** S2 参数 */
    s2?: number;
    /** H1 参数 */
    h1?: number;
    /** H2 参数 */
    h2?: number;
    /** H4 参数 */
    h4?: number;
    /** H3 参数 */
    h3?: number;

    // AmneziaWG v1.5 特有字段，使用特定格式的字符串
    i1?: string;
    i2?: string;
    i3?: string;
    i4?: string;
    i5?: string;
    j1?: string;
    j2?: string;
    j3?: string;
    /** I/J time 参数 (秒) */
    itime?: number;

    /** [允许其他自定义 AmneziaWG 选项] */
    [key: string]: any;
  };

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

/**
 * Clash SSH 代理节点配置
 */
interface SshProxyNode {
  /** 节点名称 */
  name: string;

  /** 代理类型，这里是 ssh */
  type: 'ssh';

  /** 服务器地址/域名 */
  server: string;

  /** 端口号，默认为 22 */
  port: number;

  /** 用户名 */
  username: string;

  /** [可选] 密码认证。与 private-key 互斥 */
  password?: string;

  /** [可选] 私钥文件的路径或内容。与 password 互斥 */
  'private-key'?: string;

  /** [可选] 私钥的密码 (Passphrase) */
  'private-key-passphrase'?: string;

  /** [可选] 服务器主机公钥列表，用于验证服务器身份 (Host Key Pinning) */
  'host-key'?: string[];

  /** [可选] 允许的服务器主机密钥算法 */
  'host-key-algorithms'?: string[];

  /** [可选] 允许其他未显式列出的配置字段 */
  [key: string]: any;
}

type ProxyNode = (
  | HttpProxyNode
  | Socks5ProxyNode
  | ShadowsocksProxyNode
  | ShadowsocksRProxyNode
  | SnellProxyNode
  | VmessProxyNode
  | VlessProxyNode
  | TrojanProxyNode
  | AnyTlsProxyNode
  | MieruProxyNode
  | SudokuProxyNode
  | HysteriaProxyNode
  | Hysteria2ProxyNode
  | TuicProxyNode
  | WireGuardProxyNode
  | SshProxyNode
) & {
  'dialer-proxy'?: string;
  [key: string]: any;
};

/**
 * 代理提供者 (Proxy Provider) 的健康检查配置
 */
interface HealthCheckConfig {
  /** 是否启用健康检查 */
  enable: boolean;
  /** 健康检查的目标 URL */
  url: string;
  /** 健康检查的间隔时间（秒） */
  interval: number;
  /** 健康检查的超时时间（毫秒） */
  timeout: number;
  /** 是否启用懒惰模式 (Lazy)，即只在需要时才进行检查 */
  lazy: boolean;
  /** 期望的 HTTP 状态码 */
  'expected-status'?: number;
}

/**
 * 代理提供者 (Proxy Provider) 对所有节点的覆盖配置
 */
interface ProxyOverrideConfig {
  /** [可选] 是否启用 TCP Fast Open (TFO) */
  tfo?: boolean;
  /** [可选] 是否启用 MPTCP (MultiPath TCP) */
  mptcp?: boolean;
  /** [可选] 是否启用 UDP 转发 */
  udp?: boolean;
  /** [可选] 是否启用 UDP over TCP */
  'udp-over-tcp'?: boolean;
  /** [可选] 下行带宽限制 */
  down?: string;
  /** [可选] 上行带宽限制 */
  up?: string;
  /** [可选] 是否跳过证书验证 */
  'skip-cert-verify'?: boolean;
  /** [可选] 用于拉取订阅/连接节点的拨号代理 */
  'dialer-proxy'?: string;
  /** [可选] 指定出站接口名称 */
  'interface-name'?: string;
  /** [可选] 指定路由标记 (routing mark) */
  'routing-mark'?: number;
  /** [可选] IP 版本偏好 */
  'ip-version'?: 'ipv4-prefer' | 'ipv6-prefer' | 'ipv4-only' | 'ipv6-only';
  /** [可选] 代理节点名称的附加前缀 */
  'additional-prefix'?: string;
  /** [可选] 代理节点名称的附加后缀 */
  'additional-suffix'?: string;
  /** [可选] 代理名称的重命名/替换规则 */
  'proxy-name'?: Array<{
    /** 匹配模式 (正则表达式) */
    pattern: string;
    /** 替换目标 */
    target: string;
  }>;
}

/**
 * 代理提供者 (Proxy Provider) 的配置项
 */
interface ProxyProvider {
  /** 代理提供者类型。通常为 http, file, inline */
  type: 'http' | 'file' | 'inline';
  /** 远程订阅 URL。如果 type 为 file 或 inline 则忽略 */
  url?: string;
  /** 本地文件路径，用于缓存或 file 类型的提供者 */
  path?: string;
  /** 自动更新订阅的间隔时间（秒） */
  interval: number;
  /** 用于下载订阅文件的代理，例如 DIRECT 或其他代理组/节点 */
  proxy?: 'DIRECT' | string;
  /** [可选] 订阅内容的最大大小限制（字节），0 表示无限制 */
  'size-limit'?: number;

  /** [可选] 下载订阅时使用的自定义 HTTP 头部 */
  header?: {
    'User-Agent'?: string[];
    Authorization?: string[];
    [key: string]: string[] | undefined;
  };

  /** [可选] 代理节点的健康检查配置 */
  'health-check'?: HealthCheckConfig;

  /** [可选] 覆盖提供者内所有节点的基础配置 */
  override?: ProxyOverrideConfig;

  /** [可选] 代理节点名称的包含过滤器 (正则表达式) */
  filter?: string;
  /** [可选] 代理节点名称的排除过滤器 (正则表达式) */
  'exclude-filter'?: string;
  /** [可选] 代理节点类型的排除过滤器 (正则表达式或竖线分隔的类型列表) */
  'exclude-type'?: string;

  /** [可选] 嵌入在配置中的代理节点定义，仅在特定场景下用于补充 */
  payload?: ProxyNode[];
}

interface ProxyProviderExtend extends ProxyProvider {
  name: string;
  payloadContent?: string;
}

/**
 * 完整的 proxy-providers 配置结构
 */
interface ClashProxyProviders {
  /** 键名为提供者名称，值为对应的配置对象 */
  [providerName: string]: ProxyProvider;
}

/**
 * 代理组 (Proxy Group) 的基础配置
 */
interface ProxyGroup extends HealthCheckOptions {
  /** 代理组的名称 */
  name: string;
  /** 代理组的类型 */
  type: 'select' | 'url-test' | 'fallback' | 'load-balance' | 'relay' | string;

  /** [可选] 直接列出的代理节点或代理组的名称 */
  proxies?: string[];

  /** [可选] 引用的代理提供者名称列表 */
  use?: string[];

  /** [可选] 隐藏该代理组，使其不显示在管理界面 */
  hidden?: boolean;
  /** [可选] 用于管理界面显示的图标 URL 或 Base64 字符串 */
  icon?: string;

  /** [可选] 是否禁用该组内的所有 UDP 转发 */
  'disable-udp'?: boolean;
  /** [可选] 指定出站接口名称 */
  'interface-name'?: string;
  /** [可选] 指定路由标记 (routing mark) */
  'routing-mark'?: number;

  /** [可选] 代理节点名称的包含过滤器 (正则表达式) */
  filter?: string;
  /** [可选] 代理节点名称的排除过滤器 (正则表达式) */
  'exclude-filter'?: string;
  /** [可选] 代理节点类型的排除过滤器 (正则表达式或竖线分隔的类型列表) */
  'exclude-type'?: string;

  /** [可选] 自动包含所有在配置中定义的直接代理节点 */
  'include-all-proxies'?: boolean;
  /** [可选] 自动包含所有在配置中定义的代理提供者 */
  'include-all-providers'?: boolean;

  // 对于 Select/Fallback/URL-Test/Load-Balance 组的特殊过滤选项
  /** [可选] 是否包含所有直接代理节点和 provider 节点。注意与 include-all-proxies/providers 的区别 */
  'include-all'?: boolean;
}

/**
 * URL-Test、Fallback 或 Select 组的健康检查和测试配置
 */
interface HealthCheckOptions {
  /** [可选] 健康检查或 URL 测试的 URL */
  url?: string;
  /** [可选] 健康检查或 URL 测试的间隔时间（秒） */
  interval?: number;
  /** [可选] 检查超时时间（毫秒） */
  timeout?: number;
  /** [可选] 期望的 HTTP 状态码 */
  'expected-status'?: number;

  // 仅适用于 Fallback/URL-Test/Select 组
  /** [可选] 允许失败的最大次数，超过后节点将被禁用 */
  'max-failed-times'?: number;
  /** [可选] 是否启用懒惰模式 (Lazy)，即只在需要时才进行检查 */
  lazy?: boolean;
}

interface ClashConfig {
  'proxy-providers': ClashProxyProviders;
  'proxy-groups': ProxyGroup[];
  proxies: ProxyNode[];
  rules: string[];
  dns: { [key: string]: any };
  [key: string]: any;
}
