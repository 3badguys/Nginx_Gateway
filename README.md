# Nginx 反向代理网关

基于 Docker Compose 的 Nginx 反向代理解决方案，为多个前后端分离项目提供统一的 HTTPS 入口。

## 📋 项目概述

本项目使用 Nginx 作为统一网关，通过 Docker 共享网络实现服务的反向代理，支持：
- ✅ Let's Encrypt 免费 SSL 证书（自动续期）
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
- ✅ 灵活的扩展能力
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
├── frp/
│   └── frps.toml.template          # FRP 服务端配置模板
└── nginx/
    ├── nginx.conf.template         # Nginx 主配置模板
    ├── nginx.conf                  # Nginx 主配置文件（自动生成）
    ├── conf.d/
    │   ├── domain.conf.template    # 域名配置模板
    │   └── your-domain.com.conf    # 域名配置文件（自动生成）
    ├── letsencrypt/                # Let's Encrypt 证书目录（自动生成）
    ├── www/
    │   └── certbot/                # ACME 挑战目录（自动生成）
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
- **`nginx/www/certbot/`** - ACME 挑战文件存储
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

Let's Encrypt 证书有效期为 90 天，Certbot 容器会自动续期。如需手动续期：
```bash
npm run ssl:renew your-domain.com
```

### 查看证书信息

```bash
docker compose run --rm certbot certificates
```

### 自动续期机制

**Certbot 容器**会持续运行，每 12 小时自动检查证书是否需要续期：
- ✅ 如果证书距离过期少于 30 天，自动续期
- ✅ 续期成功后，Nginx 每 6 小时重载配置以应用新证书
- ✅ 无需任何手动干预

**工作流程：**
```
Certbot 容器（持续运行）
  ↓ 每 12 小时
检查证书有效期
  ↓ 需要续期？
自动执行续期 → 更新证书文件
  ↓
Nginx 容器（持续运行）
  ↓ 每 6 小时
重载配置 → 应用新证书
```

> 💡 **提示**: 由于 Certbot 容器已经提供自动续期功能，通常不需要配置系统级定时任务。

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
2. 检查证书有效期：`docker compose run --rm certbot certificates`
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

## ⚠️ 原理与踩坑记录

记录本项目遇到的几个关键问题及其根因，供后续维护参考。

### 1. Certbot `--webroot` vs `--standalone`

**现象**：`npm run ssl:get` 在服务器上卡死不动。

**根因**：

| 模式 | 工作原理 | 依赖条件 |
|------|---------|---------|
| `--webroot` | certbot 把验证文件写入 webroot 目录，Let's Encrypt 通过 80 端口访问该文件完成验证 | **必须有 web server 在 80 端口** |
| `--standalone` | certbot 自己启动一个临时 web server 监听 80 端口完成验证 | **80 端口不能被占用** |

脚本原本的逻辑是：先 `docker compose down nginx-gateway` 释放 80 端口，然后用 `--webroot` 模式。但 webroot 模式需要 nginx 在跑才能响应 ACME 挑战 — 自相矛盾，certbot 一直等验证超时。

**修复**：改用 `--standalone`，certbot 自带临时服务器，不依赖 nginx。

### 2. `docker compose run` 会继承 service 的 `entrypoint`

**现象**：`docker compose run --rm certbot certonly --standalone ...` 执行后，`docker inspect` 发现容器运行的仍然是 docker-compose.yml 里定义的续期死循环。

**根因**：`docker compose run` 继承目标 service 的全部配置（volumes、networks、entrypoint 等），只覆盖你显式指定的部分。certbot service 在 docker-compose.yml 中定义了：

```yaml
entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --quiet; sleep 12h ...'"
```

所以 `certonly --standalone ...` 并没有消失，而是被**追加到了 entrypoint 的后面**。Docker 实际运行的是：

```
/bin/sh -c 'trap exit TERM; while :; do certbot renew --quiet; ...' certonly --standalone ...
```

`sh -c` 后面多出来的参数会变成 `$0`、`$1`、`$2`…，但脚本里没有引用 `$@`，这些参数就悄悄被吞了，壳子继续跑死循环续期。

**修复**：加 `--entrypoint certbot` 显式覆盖，让 `certonly` 真正执行。

最终命令里出现了两个 `certbot`：

```
docker compose run --rm -p 80:80 --entrypoint certbot certbot certonly --standalone ...
                                      │                 │
                                      ▼                 ▼
                                  --entrypoint 的值   service 名
```

| 位置 | 值 | 含义 |
|------|-----|------|
| `--entrypoint certbot` | 第 1 个 | 容器内的二进制 `/usr/bin/certbot`，覆盖 yaml 的续期死循环 |
| `certbot` | 第 2 个 | `docker-compose.yml` 里的 **service 名称** |

只是碰巧 service 名和二进制都叫 `certbot`，看起来像写重了。后面的 `certonly` 是 certbot 的子命令（"只获取证书不安装"）。

之所以 `certbot`（service 名）夹在中间，是 `docker compose run` 的语法规则：

```
docker compose run [OPTIONS] SERVICE [COMMAND] [ARGS...]
```

所以这条命令：

```
docker compose run --rm -p 80:80 --entrypoint certbot   certbot   certonly --standalone ...
                   ─────────── OPTIONS ──────────────   ───────   ─────── COMMAND ───────
                                                         SERVICE
```

`--entrypoint certbot` 是 OPTIONS，中间的 `certbot` 是 SERVICE，后面的 `certonly --standalone ...` 是传给容器的 COMMAND + ARGS。

### 3. Nginx 上游 DNS 解析：启动时 vs 请求时

**现象**：nginx-gateway 反复崩溃，日志报 `host not found in upstream "frps"`。

**根因**：Nginx 对 `proxy_pass` 里主机名的解析时机取决于写法：

| 写法 | 解析时机 | 上游不可用时的行为 |
|------|---------|-------------------|
| `proxy_pass http://frps:7500/;` | **启动时**解析一次，缓存结果 | `[emerg]` 崩溃，拒绝启动 |
| `set $upstream frps:7500;`<br>`proxy_pass http://$upstream/;` | **请求时**实时解析（需配合 `resolver`） | 启动正常，请求时 502 |

Docker 容器启动顺序不保证 frps 在 nginx 之前就绪。静态写法下 nginx 启动时解析不到 `frps`，直接 fatal error。

**修复**：FRP 的 proxy_pass 改用 nginx 变量写法，配合 Docker 内置 DNS (`resolver 127.0.0.11`)。

### 4. `proxy_pass` 变量写法的副作用：路径前缀剥离失效

**现象**：前端静态资源 404，浏览器收到 CSS 文件但是 HTML MIME 类型。

**根因**：Nginx `proxy_pass` 的路径剥离规则：

| 写法 | 路径处理 |
|------|---------|
| `proxy_pass http://upstream/;`（静态，带尾斜杠） | **自动剥离** location 前缀 |
| `proxy_pass http://$upstream/;`（变量，带尾斜杠） | **不剥离**，完整 URI 原样转发 |

例如 `location /gfs/` + `proxy_pass http://skateboard-frontend:80/;` 会把 `/gfs/assets/index.css` 转为 `/assets/index.css` 转发。但换成变量 `$frontend_upstream` 后就变成原样透传 `/gfs/assets/index.css`，前端 nginx 收到后匹配不到，fallback 到 SPA 的 `index.html`。

**修复**：前/后端保留静态 `proxy_pass`（它们始终运行，无启动时序问题）。FRP 用变量 + `rewrite` 手动剥离路径。

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

