# Clash 链式代理配置器

仓库地址：[13967186047lee-maker/clash-chain-configurator](https://github.com/13967186047lee-maker/clash-chain-configurator)

在线演示：[jiakuan.didi4meme.win](https://jiakuan.didi4meme.win)

这是一个面向 [Mihomo](https://github.com/MetaCubeX/mihomo) 和 Clash Verge 的链式代理配置器。它可以管理机场订阅、落地节点和 `dialer-proxy` 链式关系，并生成可直接导入 Clash Verge 的 YAML 配置。

项目默认是本地优先模式：配置只保存在当前浏览器中，不需要注册或登录。云端保险库是可选功能，只有用户主动登录并点击同步时，浏览器才会上传端到端加密密文。

## 功能

- 支持 HTTP 订阅 URL、Inline 节点 YAML、Base64 节点内容和常见节点链接。
- 支持 VMess、VLESS、Trojan、Shadowsocks、Hysteria2，以及 Clash/Mihomo YAML 导入和二维码导入。
- 配置落地节点与链式代理关系，自动生成 `dialer-proxy`。
- 生成符合当前稳定版 Mihomo 配置规范的 YAML，并在生成前校验协议字段、端口、名称和 Inline 内容。
- 本地模式无需账号、无需网络同步，适合离线使用。
- 可选云端保险库、多设备同步、加密备份导出/导入和可撤销的 Clash Verge 订阅链接。
- 邮箱验证码注册、密码重置和会话/设备管理。
- 管理后台只能查看账号、设备、配额和审计元数据，不能解密用户配置。

规则使用 [Loyalsoldier/clash-rules](https://github.com/Loyalsoldier/clash-rules)。

## 使用

1. 添加机场订阅或 Inline 节点。
2. 添加落地节点，并为需要链式代理的节点选择前置代理。
3. 检查配置校验提示，下载生成的 `clash-config.yaml`。
4. 在 Clash Verge 中创建 Local 配置并导入 YAML。

云端功能位于“云端保险库”中。登录后，输入保险库密码即可加密同步或恢复配置。保险库密码只在浏览器中派生密钥，不会发送到服务器；密码遗失后无法恢复云端配置，请提前导出加密备份。

发布订阅链接时，服务器会保存一份可被链接直接读取的明文 YAML。订阅链接本身是访问凭证，任何持有链接的人都可以读取配置，请勿公开分享；重新生成或撤销后旧链接立即失效。

## 隐私与安全

- 云端文档使用 Argon2id 派生密钥和 AES-256-GCM 加密，服务器仅保存密文、KDF 参数、大小、版本和时间等元数据。
- 登录密码使用 Argon2id 验证哈希保存，会话使用 HttpOnly、Secure、SameSite Cookie，不写入 `localStorage`。
- 服务器不会抓取订阅 URL，也不会主动访问代理内容。
- 管理员不能下载、预览或解密用户保险库，只能执行账号和元数据管理操作。
- 邮箱验证码有效期 10 分钟，最多尝试 5 次，并限制邮箱和来源地址的发送频率。

## 自托管

### 环境变量

复制 `.env.example` 为 `.env.production` 或 `.env.local`，至少配置：

| 变量                | 说明                                   |
| ------------------- | -------------------------------------- |
| `DATABASE_URL`      | PostgreSQL 连接地址                    |
| `APP_ORIGIN`        | 对外访问源，例如 `https://example.com` |
| `IP_HASH_SECRET`    | 审计日志 IP 哈希秘密                   |
| `EMAIL_CODE_SECRET` | 至少 32 个随机字符，用于验证码 HMAC    |
| `ADMIN_EMAILS`      | 首批管理员邮箱，多个邮箱用逗号分隔     |
| `RESEND_API_KEY`    | [Resend](https://resend.com) API Key   |
| `RESEND_FROM`       | Resend 已验证域名下的发件地址          |

Resend 发件域名需要先在 Resend 控制台完成 DNS 验证。例如：

```env
RESEND_FROM=no-reply@example.com
```

不要把真实密钥提交到 Git。生产环境变量文件应限制为仅服务进程可读。

### 本地开发

需要 Node.js 22、PostgreSQL 和 npm：

```bash
npm ci
npm run db:migrate
npm run dev
```

浏览器访问 `http://localhost:3000`。

提交前执行完整检查：

```bash
npm run check
```

该命令包含格式检查、ESLint、单元测试、生产构建和生产依赖漏洞审计。

### Docker/Podman 部署

项目提供 `deploy/compose.yml`，包含 PostgreSQL、Next.js 应用和 Caddy。生产部署需要：

- 一台可运行 Docker 或 Podman 的 Linux 服务器；
- PostgreSQL 持久化卷；
- 一个解析到服务器的域名；
- Caddy 对外开放 80/443 端口；
- `.env.production` 中的数据库、来源、会话、管理员和 Resend 配置。

```bash
podman-compose -f deploy/compose.yml up -d
```

Cloudflare 可以作为 DNS 或反向代理使用。若启用代理，请确保 `APP_ORIGIN` 使用用户实际访问的 HTTPS 域名。

## 架构

- Next.js App Router：配置器、账号 API、同步 API、订阅 API 和 `/admin` 后台。
- PostgreSQL + Drizzle：用户、会话、设备、加密文档、订阅令牌和审计记录。
- 客户端 Web Crypto：保险库加密、解密、备份导入和备份导出。
- Mihomo 配置生成器：纯函数生成全新配置，避免删除机场后残留旧代理组。
- Caddy：TLS、HTTPS 重定向和反向代理。

## API 概览

- `POST /api/auth/register`、`/login`、`/logout`、`/change-password`、`/reset-password`、`/send-code`
- `GET /api/auth/session`
- `GET/PUT/DELETE /api/sync/document`
- `GET/PUT/DELETE /api/sync/subscription`
- `GET /api/account/devices`、`DELETE /api/account/devices/:id`
- `GET /api/admin/users`、`PATCH /api/admin/users/:id/status`
- `GET /api/admin/audit-logs`、`GET /api/admin/usage`

所有用户数据 API 都依据服务端会话绑定用户，不接受客户端传入的任意 `userId` 作为授权依据。

## 许可证

请以仓库中的许可证文件和上游项目许可为准。
