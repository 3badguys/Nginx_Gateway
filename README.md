# Nginx 反向代理网关

基于 Docker Compose 的 Nginx 反向代理解决方案，为多个前后端分离项目提供统一的 HTTPS 入口。

## 📋 项目概述

本项目使用 Nginx 作为统一网关，通过 Docker 共享网络实现服务的反向代理，支持：
- ✅ Let's Encrypt 免费 SSL 证书（支持泛域名`*.your-domain.com`以及自动续期）
- ✅ HTTP 自动重定向到 HTTPS (301)
- ✅ 多项目路径转发
- ✅ WebSocket 支持，可以用于：
  - Vite HMR（开发环境热更新）
  - Socket.io 实时通信
  - 聊天应用
  - 在线协作编辑
  - 实时数据推送
  - GraphQL Subscriptions
  - 任何使用 WebSocket 的应用
- ✅ FRP 服务端集成（内网穿透）

### 当前配置

| 配置项 | 值 |
|--------|-----|
| 域名 | `your-domain.com` |
| 共享网络 | `shared_gateway_net` |
| 前端服务 | `skateboard-frontend` (容器内端口 80) |
| 后端服务 | `skateboard-backend` (容器内端口 3000，通过前端 nginx 转发) |
| 前端访问路径 | `https://your-domain.com/gfs/` |
| API 路径 | `https://your-domain.com/gfs/api/*` → 前端 nginx `/api/*` → backend |
| HTTP 端口 | 80 (自动重定向到 443) |
| HTTPS 端口 | 443 |

## 📁 项目结构

```
Nginx_Gateway/
├── docker-compose.yml              # Docker Compose 配置文件
├── package.json                    # Node.js 包配置和脚本定义
├── README.md                       # 项目说明文档
├── .env                            # 环境变量配置（需手动创建）
├── .env.example                    # 环境变量配置示例
├── .gitignore                      # Git 忽略配置
├── .gitattributes                  # Git 换行符配置
├── scripts/                        # Node.js 脚本目录
│   ├── generate-config.js          # Nginx 配置生成脚本
│   ├── get-ssl-cert.js             # SSL 证书获取脚本
│   ├── renew-cert.js               # SSL 证书续期脚本
│   ├── utils.js                    # 公共工具函数
│   └── README.md                   # 脚本使用说明
├── acme/
│   └── dns-env.sh                  # DNS provider env mapping (entrypoint wrapper)
├── frp/
│   └── frps.toml.template          # FRP 服务端配置模板
└── nginx/
    ├── nginx.conf.template         # Nginx 主配置模板
    ├── nginx.conf                  # Nginx 主配置文件（自动生成）
    ├── proxy-common.conf           # 公共代理设置
    ├── conf.d/
    │   ├── domain.conf.template    # 域名配置模板
    │   └── your-domain.com.conf    # 域名配置文件（自动生成）
    ├── letsencrypt/                # Let's Encrypt 证书目录（自动生成）
    ├── www/
    │   └── certbot/                # ACME HTTP 挑战目录（DNS 模式下未使用）
    └── logs/                       # Nginx 日志目录（自动生成）
```

### 文件说明

#### 📄 配置文件
- **`docker-compose.yml`** - Docker 服务编排配置
- **`.env`** - 环境变量配置（从 `.env.example` 复制并修改）
- **`.env.example`** - 环境变量配置模板，包含所有必需配置项

#### 💻 脚本文件
- **`scripts/generate-config.js`** - 验证配置并生成 Nginx 和 FRP 配置文件
- **`scripts/get-ssl-cert.js`** - 获取 Let's Encrypt SSL 证书
- **`scripts/renew-cert.js`** - 手动续期 SSL 证书
- **`scripts/utils.js`** - 公共工具函数（环境加载、命令执行等）

#### 🔧 Nginx 配置
- **`nginx/nginx.conf.template`** - Nginx 主配置模板（使用环境变量）
- **`nginx/conf.d/domain.conf.template`** - 域名配置模板（使用环境变量）
- **`nginx/nginx.conf`** - 生成的 Nginx 主配置（由模板生成）
- **`nginx/conf.d/{DOMAIN}.conf`** - 生成的域名配置（由模板生成）

#### 📦 自动生成的目录
- **`nginx/letsencrypt/`** - Let's Encrypt 证书存储
- **`acme/dns-env.sh`** - DNS provider env mapping entrypoint（添加新供应商在此修改）
- **`nginx/www/certbot/`** - ACME HTTP 挑战目录（DNS 模式下未使用，预留）
- **`nginx/logs/`** - Nginx 访问和错误日志

## 🚀 快速开始

### 前置要求

- Docker Engine
- Docker Compose v2.0+
- 域名已解析到服务器 IP
- 80 和 443 端口可访问

### 部署步骤

#### 🚀 快速部署 (推荐)

**所有平台 (Windows/Mac/Linux):**
```bash
npm start
```

此命令会：
1. 执行 `npm run ssl:get` — 检查/获取 SSL 证书（standalone 模式，不依赖 nginx）
2. 执行 `docker compose up -d` — 启动所有服务

或分步执行：
```bash
npm run config:generate  # 生成 Nginx 配置
npm run ssl:get          # 获取 Let's Encrypt 证书
npm start                # 启动服务
```

快速启动脚本会自动：
1. 验证 `.env` 配置完整性
2. 创建必要的目录
3. 检查 SSL 证书是否存在
4. 提示获取 Let's Encrypt 证书（如需要）
5. 启动所有 Docker 服务
6. 显示服务状态和访问地址

---

#### 📝 手动部署

#### 1️⃣ 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置所有必需项：
```bash
# Domain & Email
DOMAIN=your-domain.com
LETSENCRYPT_EMAIL=your-email@example.com

# Frontend Configuration
FRONTEND_SERVICE_NAME=skateboard-frontend
FRONTEND_PORT=80
FRONTEND_PATH=/gfs/

# Backend Configuration (optional — frontend nginx handles /api/* routing)
# BACKEND_SERVICE_NAME=skateboard-backend
# BACKEND_PORT=3000
# BACKEND_PATH=/gfs/api/

# DNS-01 challenge (required for wildcard SSL)
DNS_PROVIDER=west_cn          # see acme/dns-env.sh for supported providers
DNS_API_USER=your-api-user
DNS_API_KEY=your-api-key      # plain text, auto-hashed by entrypoint

# Nginx Configuration
NGINX_WORKER_PROCESSES=auto
NGINX_WORKER_CONNECTIONS=1024
CLIENT_MAX_BODY_SIZE=10m
ACCESS_LOG=/var/log/nginx/access.log
ERROR_LOG=/var/log/nginx/error.log
```

> 💡 **提示**: 标记为必需的配置项不能留空。Backend 已注释（API 请求通过前端 nginx 转发）。

#### 2️⃣ 生成 Nginx 配置

```bash
npm run config:generate
```

此命令会：
- 验证 `.env` 中所有必需配置项
- 创建必要的目录结构
- 从模板生成 `nginx/nginx.conf`
- 从模板生成 `nginx/conf.d/{DOMAIN}.conf`

#### 3️⃣ 获取 Let's Encrypt 证书

```bash
npm run ssl:get your-domain.com your-email@example.com
```

> ⚠️ **注意**: 
> - 域名必须已解析到服务器 IP
> - 80 端口必须可访问（用于 ACME 验证）
> - 确保证书获取成功后再启动服务

#### 4️⃣ 启动服务

```bash
docker compose up -d
```

#### 5️⃣ 验证部署

查看容器运行状态：
```bash
docker compose ps
```

查看 Nginx 日志：
```bash
docker compose logs -f nginx-gateway
```

#### 7️⃣ 配置本地 DNS (可选)

在本地 hosts 文件中添加域名解析：

**Linux** (`/etc/hosts`)：
```
127.0.0.1 your-domain.com
```

#### 8️⃣ 访问应用

打开浏览器访问：
- HTTPS: `https://your-domain.com/gfs/`
- HTTP: `http://your-domain.com/gfs/` (会自动重定向到 HTTPS)

## 🔧 常用命令

### 启动服务
```bash
docker compose up -d
```

### 停止服务
```bash
docker compose down
```

### 重启服务
```bash
docker compose restart
```

### 查看日志
```bash
# 查看所有日志
docker compose logs -f

# 查看 Nginx 日志
docker compose logs -f nginx-gateway
```

### 重新构建
```bash
docker compose up -d --build
```

### 进入容器
```bash
# 进入 Nginx 容器
docker exec -it nginx-gateway sh
```

## 📝 添加新项目

要添加新的前后端分离项目,请按以下步骤操作:

### 方法一:使用配置模板 (推荐)

1. 复制配置模板:
   ```bash
   cp nginx/conf.d/example.conf.template nginx/conf.d/your-domain.com.conf
   ```

2. 编辑配置文件,修改以下内容:
   - `server_name`: 你的域名
   - `ssl_certificate`: SSL 证书路径
   - `proxy_pass`: 后端服务地址
   - `location` 路径

3. 在 `docker-compose.yml` 中添加新服务

4. 重启 Nginx:
   ```bash
   docker compose restart nginx-gateway
   ```

### 方法二:手动配置

### 1. 在 Docker Compose 中添加服务

编辑 `docker-compose.yml`,添加新服务:

```yaml
services:
  # ... 现有服务 ...
  
  new-project-frontend:
    image: node:18-alpine
    container_name: new-project-frontend
    working_dir: /app
    command: sh -c "npm install && npm run dev -- --host 0.0.0.0"
    volumes:
      - ../new-project:/app
    expose:
      - "80"
    networks:
      - shared_gateway_net
    restart: unless-stopped
```

### 2. 创建 Nginx 配置文件

在 `nginx/conf.d/` 目录下创建新的配置文件,或在现有配置文件中添加 location 块:

```nginx
# 新项目路径转发
location /new-project/ {
    proxy_pass http://new-project-frontend:80/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
}
```

### 3. 重启 Nginx

```bash
docker compose restart nginx-gateway
```

## 🔐 SSL 证书管理

### 获取证书

首次部署时，运行：
```bash
npm run ssl:get your-domain.com your-email@example.com
```

或使用命令行参数覆盖 `.env` 配置：
```bash
node scripts/get-ssl-cert.js your-domain.com your-email@example.com
```

### 手动续期证书

Let's Encrypt 证书有效期为 90 天，acme.sh daemon 内置 cron 会自动续期。如需手动续期：
```bash
npm run ssl:renew your-domain.com
```

### 查看证书信息

```bash
docker compose run --rm -T acme acme.sh --list
```

### 自动续期机制

**acme.sh daemon** 内置 `crond`，每天检查一次证书是否需要续期：
- ✅ 如果证书距离过期少于 30 天，自动续期
- ✅ 续期成功后，`--reloadcmd` 自动重载 nginx
- ✅ 无需任何手动干预

**工作流程：**
```
acme.sh daemon（持续运行）
  ↓ 每天
检查证书有效期
  ↓ 需要续期？
自动执行 renew → 更新证书文件
  ↓ --reloadcmd
docker compose exec nginx-gateway nginx -s reload
```

> 💡 **提示**: 由于 acme.sh daemon 已内置定时续期，不需要配置系统级定时任务。

## 💻 Node.js 脚本说明

本项目使用 Node.js 脚本替代了传统的 Shell 脚本，提供更好的跨平台支持。

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run config:generate` | 生成 Nginx 配置文件 |
| `npm run ssl:get` | 获取 Let's Encrypt SSL 证书 |
| `npm run ssl:renew` | 手动续期 SSL 证书 |
| `npm start` | 获取/检查 SSL 证书并启动所有服务 |
| `npm stop` | 停止所有服务 |

### 直接执行脚本

也可以直接使用 `node` 命令执行：

```bash
node scripts/generate-config.js
node scripts/get-ssl-cert.js your-domain.com your-email@example.com
node scripts/renew-cert.js your-domain.com
```

### 跨平台兼容

所有脚本在以下平台均可正常运行：
- ✅ Windows (PowerShell/CMD)
- ✅ macOS (Terminal)
- ✅ Linux (Bash/Zsh)

无需 WSL、Git Bash 或 Cygwin！

## 🐛 故障排查

### 1. 容器无法启动

检查日志:
```bash
docker compose logs nginx-gateway
```

常见原因:
- SSL 证书文件不存在
- 端口被占用 (80/443)
- 配置文件语法错误

### 2. 502 Bad Gateway

检查后端服务是否正常运行：
```bash
docker compose ps
docker network inspect shared_gateway_net
```

确认前端/后端服务已连接到共享网络，并且 Nginx 配置中的服务名和端口正确。

### 3. HTTPS 证书问题

如果遇到证书错误：
1. 确保证书已成功获取：`ls nginx/letsencrypt/live/your-domain.com/`
2. 检查证书有效期：`docker compose run --rm -T acme acme.sh --list`
3. 重新获取证书：`npm run ssl:get your-domain.com your-email@example.com`
4. 检查 `.env` 配置是否完整：`npm run config:generate`

### 4. 配置验证失败

如果 `npm run config:generate` 报错：
```bash
Error: Missing required environment variables in .env:
  - DOMAIN
  - LETSENCRYPT_EMAIL
  - FRONTEND_SERVICE_NAME
  ...
```

**解决方法：**
1. 检查 `.env` 文件是否存在
2. 确保所有必需的配置项都已设置（参考 `.env.example`）
3. 不要留空任何配置项
4. 重新运行 `npm run config:generate`

### 5. 前端 HMR 不工作

确保 Nginx 配置中包含 WebSocket 支持:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## 📊 网络架构

```
                    Internet
                       │
                  [浏览器访问]
                       │
              http://your-domain.com/gfs/
              https://your-domain.com/gfs/api/
                       │
                  [Port 80/443]
                       │
                ┌──────────────┐
                │ Nginx Gateway│
                │  (反向代理)   │
                └──────────────┘
                       │
            shared_gateway_net (Docker 网络)
                       │
        ┌──────────────┴──────────────┬────────────────┐
        │                             │                │
┌───────────────┐           ┌────────────────┐ ┌─────────────┐
│ skateboard-   │           │ skateboard-    │ │  其他服务... │
│ frontend (:80)│           │ backend (:3000)│ │             │
│ (含 /api/→    │──────→    │                │ │  :port      │
│  backend 路由) │           └────────────────┘ └─────────────┘
└───────────────┘
```

### 请求流程

1. **HTTP 请求** (端口 80):
   ```
   浏览器 → Nginx (80) → 301 重定向 → HTTPS (443)
   ```

2. **HTTPS 请求** (端口 443):
   ```
   浏览器 → Nginx (443, SSL 解密) → 路径匹配 → 转发到后端服务
   ```

3. **路径转发示例**:
   ```
   # 前端资源请求
   https://your-domain.com/gfs/xxx 
     → Nginx 匹配 /gfs/，剥除 /gfs/
     → 转发 http://skateboard-frontend:80/xxx → 前端 nginx 返回资源
   
   # 后端 API 请求（统一走前端 nginx）
   https://your-domain.com/gfs/api/students
     → Nginx 匹配 /gfs/，剥除 /gfs/
     → 转发 http://skateboard-frontend:80/api/students
     → 前端 nginx 的 location /api/ → http://skateboard-backend:3000/students
   ```

所有服务通过 Docker 共享网络 `shared_gateway_net` 通信，Nginx 作为统一入口处理外部请求。

### FRP 内网穿透

项目内置 FRP 服务端，支持将公网流量通过加密隧道穿透到内网。

#### 场景一：正常直连（无 FRP）

```
                   Internet
                      │
                 [浏览器访问]
                      │
               https://your-domain.com:443/gfs/
                      │
               ┌──────────────┐
               │ Nginx Gateway│  ← SSL 终止 + 反向代理
               │   (宿主机)    │
               └──────────────┘
                      │
              shared_gateway_net
                      │
          ┌───────────┴────────────┐
          ▼                        ▼
   skateboard-frontend      skateboard-backend
```

**Nginx 直接暴露在服务器上，独占 443 端口处理 HTTPS。** 适用于所有服务都在同一台机器的场景。

#### 场景二：FRP 内网穿透 — HTTP（vhost :8080）

```
  浏览器                   公网服务器                      内网
  ──────                  ──────────                    ────
                          ┌──────────┐
  http://your-domain.com    │FRP 服务端│   FRP 隧道(HTTP)   ┌──────────────┐
  :8080/gfs/ ──────────→ │  :8080   │ ─────────────────→ │ FRP 客户端    │
                          │(vhost)   │                    │ :7000 ──→    │
                          └──────────┘                    │ nginx:80     │
                                                         │ (本地网关)    │
                                                         └──────────────┘
                                                               │
                                                       shared_gateway_net
                                                               │
                                                    ┌──────────┴──────────┐
                                                    ▼                     ▼
                                             skateboard-frontend   skateboard-backend
```

**FRP 服务端监听 8080，接收浏览器 HTTP 请求，通过 FRP 隧道明文转发到内网客户端，客户端再丢给本地 nginx:80。** 不加密，适合内网环境或测试。

#### 场景三：FRP 内网穿透 — HTTPS（vhost :8443）

```
  浏览器                   公网服务器                      内网
  ──────                  ──────────                    ────
  ① TLS 握手 (8443)
  ───────────────────┐
                     ▼
  https://your-domain.com  ┌──────────────┐
  :8443/gfs/ ──────────→ │FRP 服务端     │  FRP 隧道(加密)  ┌──────────────┐
                         │vhostHTTPS    │ ───────────────→ │ FRP 客户端    │
                         │ (Dashboard配证书)│(transport.tls加密)│ :7000 ──→    │
                         │解密后 → 明文   │                  │ nginx:80     │
                         └──────────────┘                   │ (本地网关)    │
                                                           └──────────────┘
                                                                 │
                                                         shared_gateway_net
                                                                 │
                                                      ┌──────────┴──────────┐
                                                      ▼                     ▼
                                               skateboard-frontend   skateboard-backend
```

**两道 TLS 互不干扰：**

| TLS 层 | 谁和谁之间 | 配置位置 | 证书 |
|--------|-----------|---------|------|
| ① 浏览器 ↔ FRP 服务端 :8443 | 浏览器拿到的是有效 HTTPS | FRP Dashboard → TLS 证书管理 | FRP 服务端（Dashboard 上传） |
| ② FRP 服务端 ↔ FRP 客户端 :7000 | FRP 隧道自身加密（可选） | 客户端 `transport.tls.enable = true`（自签证书） | FRP 客户端（自动生成） |

**nginx 从头到尾只看到明文 HTTP（`localPort = 80`），不参与外部 TLS。FRP 客户端 `type = "https"` 只管 :8443 对外那段，跟 nginx 无关。**

#### 场景四：FRP Dashboard 管理（nginx 子路径代理）

```
  浏览器                              公网服务器
  ──────                              ──────────
  https://your-domain.com/frps/ ────→ ┌──────────────┐
                                   │ Nginx Gateway │  内部 HTTP
                                   │ location /frps/│ ────────────→ frps:7500
                                   │ sub_filter    │  (Dashboard)
                                   │ proxy_redirect│
                                   └──────────────┘
```

**Dashboard 只在内网暴露 7500，通过 nginx 子路径 `/frps/` + HTTPS 对外。** Nginx 用 `sub_filter` 改写页面内的绝对路径（`/static/` → `/frps/static/`），`proxy_redirect` 改写认证跳转的 Location 头，保证所有请求都不跑出 `/frps/` 前缀。

#### 场景五：FRP 隧道 + SPA 子路径部署

**问题**：场景二/三中，公网 nginx 用 `proxy_pass http://frps:8080/;`（带尾斜杠）剥离了 `/frpc/`，传到本地 nginx 的路径是 `/gfs/xxx`。SPA 前端 `VITE_BASE=/gfs/` 能正常工作，但页面 JS 路由是在浏览器里跑的——浏览器 URL 是 `/frpc/gfs/xxx`，SPA 不认识 `/frpc/` 前缀，会把 `/gfs/` 拼到 URL 前面，导致跳转错乱。

**方案**：让 `/frpc/` 前缀端到端透传，SPA 构建时也带上这个 base。

```
  浏览器                              公网服务器                 内网
  ──────                              ──────────               ────
  https://your-domain.com/frpc/gfs/ ──→ ┌──────────────┐
                                      │ Nginx Gateway │
                                      │ location /frpc/│        FRP 隧道
                                      │ proxy_pass     │ ─────────────────→ ┌──────────────┐
                                      │ http://frps:8080│                    │ FRP 客户端    │
                                      │ (无尾斜杠,      │                    │ nginx:80     │
                                      │  不剥离/frpc/)  │                    │              │
                                      └──────────────┘                     │ location     │
                                                                           │ /frpc/gfs/   │
                                                                           │ /frpc/gfs/api/│
                                                                           └──────────────┘
```

**三道分工**：

| 环节 | 配置 | 作用 |
|------|------|------|
| 公网 nginx | `proxy_pass http://frps:8080;` （无尾斜杠） | `/frpc/gfs/xxx` 原样透传，不剥离 |
| 内网 nginx | `location /frpc/gfs/ { proxy_pass http://frontend:80/; }` | 剥离 `/frpc/gfs/`，前端收到标准路径 |
| 内网前端 | `VITE_BASE=/frpc/gfs/` | SPA 路由 base 匹配浏览器 URL，不跳偏 |

**与直连的共存**：本地 nginx 同时保留 `location /gfs/`（直连）和 `location /frpc/gfs/`（穿透），两套路径各自剥离前缀后都指向同一个前端。前端构建两次或配置环境变量切换 `VITE_BASE`。

#### FRP 客户端配置示例

对应场景二/三的内网客户端 `frpc.toml`：

```toml
serverAddr = "your-domain.com"
serverPort = 7000
auth.token = "change-me-to-a-random-string"

# 开启隧道加密（客户端自签证书，无需服务端配置）
transport.tls.enable = true

[[proxies]]
name = "nginx-gateway-http"
type = "http"
localIP = "nginx-gateway"
localPort = 80
customDomains = ["your-domain.com"]

[[proxies]]
name = "nginx-gateway-https"
type = "https"
localIP = "nginx-gateway"
localPort = 80
customDomains = ["your-domain.com"]

# Subdomain example — access via pi.your-domain.com
[[proxies]]
name = "nginx-gateway-pi"
type = "http"
localIP = "127.0.0.1"
localPort = 80
subdomain = "pi"
```

## ⚠️ 原理与踩坑记录

记录本项目遇到的几个关键问题及其根因，供后续维护参考。

### 1. HTTP-01 vs DNS-01 验证模式

从 certbot 迁移到 acme.sh 的核心原因：需要泛域名证书（`*.your-domain.com`）。

| 验证模式 | 原理 | 支持泛域名 | 依赖 |
|---------|------|-----------|------|
| HTTP-01 (certbot `--standalone`) | 在 80 端口放验证文件，Let's Encrypt 访问确认 | ❌ | 80 端口可用，需停 nginx |
| DNS-01 (acme.sh `--dns dns_<provider>`) | 在 DNS 记录里加 TXT 值，Let's Encrypt 查询确认 | ✅ | DNS API 凭证 |

**为什么要停 nginx**：certbot `--standalone` 自己启动临时 web server 监听 80 端口，nginx 也绑了 80，必须停掉 nginx 才能释放端口。acme.sh DNS-01 模式全程不走 80 端口，nginx 可以不中断。

### 2. acme.sh daemon 模式 vs certbot entrypoint 死循环

certbot 时代必须在 docker-compose.yml 里配一个 entrypoint 死循环来跑 `certbot renew`，每次手动执行 `certonly` 还要 `--entrypoint` 覆盖——这个设计源于 certbot 容器没有内置 cron。

acme.sh 自带 `daemon` 模式，容器里跑 `crond` 每天检查证书到期并自动续期。手动签发或续期使用 `docker compose run --rm -T acme acme.sh --issue/--renew ...`（经过 `acme/dns-env.sh` entrypoint 自动映射 DNS 环境变量）。

### 3. Nginx 上游 DNS 解析：启动时 vs 请求时

**现象**：nginx-gateway 反复崩溃，日志报 `host not found in upstream "frps"`。

**根因**：Nginx 对 `proxy_pass` 里主机名的解析时机取决于写法：

| 写法 | 解析时机 | 上游不可用时的行为 |
|------|---------|-------------------|
| `proxy_pass http://frps:7500/;` | **启动时**解析一次，缓存结果 | `[emerg]` 崩溃，拒绝启动 |
| `set $upstream frps:7500;`<br>`proxy_pass http://$upstream/;` | **请求时**实时解析（需配合 `resolver`） | 启动正常，请求时 502 |

Docker 容器启动顺序不保证 frps 在 nginx 之前就绪。静态写法下 nginx 启动时解析不到 `frps`，直接 fatal error。

**尝试过**：FRP 的 proxy_pass 使用变量写法 + `resolver 127.0.0.11`，绕过启动时检查。

**最终方案**：回归静态写法 `proxy_pass http://frps:7500/;`。原因：frps 是常驻服务（`restart: unless-stopped`），并非频繁启停的临时容器。即使偶尔重启，Docker DNS 更新 IP 后 nginx 短时间 502，下一轮请求即恢复。拿这个短暂退化换掉变量写法的 `resolver` 依赖和路径前缀剥离失效问题，更干净。

### 4. `proxy_pass` 变量写法的副作用：路径前缀剥离失效

**现象**：前端静态资源 404，浏览器收到 CSS 文件但是 HTML MIME 类型。

**根因**：Nginx `proxy_pass` 的路径剥离规则：

| 写法 | 路径处理 |
|------|---------|
| `proxy_pass http://upstream/;`（静态，带尾斜杠） | **自动剥离** location 前缀 |
| `proxy_pass http://$upstream/;`（变量，带尾斜杠） | **不剥离**，完整 URI 原样转发 |

例如 `location /gfs/` + `proxy_pass http://skateboard-frontend:80/;` 会把 `/gfs/assets/index.css` 转为 `/assets/index.css` 转发。但换成变量 `$frontend_upstream` 后就变成原样透传 `/gfs/assets/index.css`，前端 nginx 收到后匹配不到，fallback 到 SPA 的 `index.html`。

**修复**：前/后端保留静态 `proxy_pass`（它们始终运行，无启动时序问题）。FRP Dashboard 改回静态写法后，路径前缀自动剥离，配合 `sub_filter` + `proxy_redirect` 处理页面内部的绝对路径引用（详见第 8 节）。

### 5. Docker 内置 DNS：`127.0.0.11`

**是什么**：Docker 在每个加入自定义网络的容器内嵌入的 DNS 服务器。它自动解析同网络下其他容器的 hostname，且能感知容器重启后的 IP 变化。

**为什么需要显式配置**：Nginx 默认用系统的 `/etc/resolv.conf`，在容器里会自动指向 `127.0.0.11`，但 nginx 只在启动时解析一次然后缓存。显式写 `resolver 127.0.0.11 valid=30s;` 告诉 nginx 每 30 秒刷新 DNS 缓存，这样容器 IP 变了不用 reload nginx。

### 6. Docker 容器间通信用容器内端口，不是宿主机端口

**现象**：502 Bad Gateway，nginx error log 显示 `connect() failed ... Connection refused` 连 `172.20.0.4:5173`。

**根因**：`docker ps` 看到 `0.0.0.0:5173->80/tcp`，`.env` 里顺手写了 `FRONTEND_PORT=5173`。但 5173 是宿主机端口映射，容器间通信走 Docker 内网，直接连容器的**内部端口** 80。5173 在容器内根本没进程监听。

**修复**：`FRONTEND_PORT=80`（容器内实际监听端口）。

### 7. Nginx 健康检查的 HTTPS 重定向陷阱

**现象**：nginx-gateway status 一直 `unhealthy`，healthcheck 日志显示 `ssl_client: SSL_connect` + `certificate verify failed`。

**根因**：健康检查 `wget --spider http://localhost/` 访问 80 端口，nginx 返回 301 重定向到 HTTPS。wget 跟过去访问 `https://localhost/`，但 SSL 证书是签给域名（如 `your-domain.com`）的，`localhost` 不匹配 → SSL 验证失败 → exit code 1 → unhealthy。

**修复**：在 HTTP server 加 `/health` 端点直接返回 200（不跳转），wget 改为访问 `/health`。

### 8. Nginx `sub_filter` 响应体改写 vs `proxy_redirect` 响应头改写

给 FRP Dashboard 做子路径代理时，Dashboard 页面里引用的静态资源和 API 接口都是绝对路径（`/static/xxx`、`/api/xxx`），不认 `/frps/` 前缀，导致资源 404、认证后重定向跑偏。需要两层改写配合：

| 指令 | 作用域 | 解决的问题 |
|------|--------|-----------|
| `sub_filter` | HTTP 响应**体**（HTML/CSS/JS 文本） | 页面内容里 `src="/static/` → `src="/frps/static/` 等 |
| `proxy_redirect` | HTTP 响应**头**（`Location` 字段） | 302/301 重定向 `/static/xxx` → `/frps/static/xxx` |

两者互不冲突——一个改 body，一个改 header，各管各的。

**关键配置**：

```nginx
# 关闭上游压缩，否则 sub_filter 改不了二进制 gzip 内容
proxy_set_header Accept-Encoding "";

# 改写响应体中的绝对路径
sub_filter_types *;           # 对所有 MIME 类型生效（默认仅 text/html）
sub_filter_once off;          # 替换所有出现，不止第一个
sub_filter 'src="/static/' 'src="/frps/static/';
sub_filter 'href="/static/' 'href="/frps/static/';
sub_filter '"/api/' '"/frps/api/';

# 改写重定向 Location 头
proxy_redirect / /frps/;
```

**注意**：`sub_filter` 只能替换响应体中的**字面量**，对于 JavaScript 运行时动态构造的 URL（如 `fetch('/' + path)`）无能为力。不过 FRP Dashboard 的静态资源路径是硬编码字符串，覆盖率足够。

### 9. frps 使用 host 模式后，ports 和 networks 配置被忽略

**现象**：`docker compose up` 后，`docker ps` 显示 frps 容器没有端口映射，且 `docker network inspect shared_gateway_net` 中找不到 frps 容器。

**根因**：当服务设置 `network_mode: host` 后，Docker Compose **会忽略该服务的 `ports` 字段和 `networks` 字段**。host 模式直接使用宿主机网络栈，不需要也无法加入自定义网络或进行端口映射。

**修复**：将 `ports` 和 `networks` 整段注释或删除，避免配置误导。frps 的端口（如 7000、7500）会直接监听在宿主机上，通过 `ss -tlnp | grep frps` 可验证。

### 10. frps 改用 host 模式后，nginx 需通过 host.docker.internal 访问

**现象**：frps `network_mode: host` 后，nginx 代理 `/frps/` 路径返回 502，日志显示 `connect() failed ... Connection refused` 连 `frps:7500`。

**根因**：frps 不再属于自定义 Docker 网络，nginx 无法通过容器名 `frps` 解析到其 IP。`host` 模式下 frps 端口直接监听在宿主机，但 nginx 容器内需要借助特殊域名 `host.docker.internal` 才能访问宿主机。

**修复**：

1. 在 nginx 容器添加 `extra_hosts` 映射：

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

2. 将 nginx 配置中的 `proxy_pass http://frps:7500/` 改为 `proxy_pass http://host.docker.internal:7500/`（Dashboard 和 Vhost HTTP 同理）。

3. 重启 nginx 容器。
