# 项目开发待办事项 (TODO)

## Phase 1: 项目初始化与基础架构
- [x] 初始化 Git 仓库与 Go Module (uptime_w33d)
- [x] 设计并搭建项目目录结构 (Clean Architecture)
  - `cmd/`, `internal/`, `pkg/`, `api/`, `configs/`
- [x] 配置 PostgreSQL 数据库连接与 GORM/Sqlx 初始化
- [x] 实现基础日志 (Logger) 与配置加载 (Config) 模块
- [x] 编写数据库迁移脚本 (Migration) - 创建 `users`, `monitors` 等核心表

## Phase 2: 核心 API 与 用户认证
- [x] 实现用户模型 (User Model) 与数据库操作
- [x] 实现 JWT 认证中间件 (Auth Middleware)
- [x] 实现用户登录/注册 API (`/api/auth/*`)
- [x] 实现监控项 (Monitor) 的 CRUD API (`/api/monitors/*`)
- [x] 实现监控分组 (Group) 的 CRUD API

## Phase 3: 探测调度引擎 (Scheduler)
- [x] 定义探测插件接口 (`ProbePlugin`)
- [x] 实现基础探测插件
  - [x] HTTP/HTTPS Probe
  - [x] TCP Probe
  - [x] Ping Probe
- [x] 实现调度器 (Scheduler)
  - [x] 基于 Interval 循环执行任务
  - [x] 任务并发控制
- [x] 实现探测结果存储 (`check_results`)
- [x] 实现状态变更检测逻辑 (State Change Detection)
- [x] **实现 Push Monitor (Heartbeat) 逻辑**
  - [x] 编写 Push API 规范文档
  - [x] 实现后端 Push 处理逻辑与调度检测

## Phase 4: 通知系统 (Notification)
- [x] 定义通知插件接口 (`NotifierPlugin`)
- [x] 实现基础通知渠道
  - [x] Webhook
  - [x] Email (SMTP)
  - [ ] Telegram/Slack
- [x] 实现通知订阅管理 API
- [x] 实现事件触发通知流程 (Event Dispatcher)
- [x] 实现通知渠道管理 API (`/api/channels`)

## Phase 5: 公开状态页 API (Status Page)
- [x] 实现公开状态页 API (`/api/public/status`)
- [x] 优化查询性能 (缓存策略 Redis)
- [x] 实现历史事件查询接口 (用于图表)

## Phase 6: 前端开发 (Web Client)
- [x] 初始化前端项目 (React/Vue + TS)
- [x] 实现管理后台 (Dashboard)
  - [x] 登录页
  - [x] 监控列表与配置页
  - [x] 监控项添加/编辑/删除功能
  - [x] 通知渠道配置页
- [x] 实现公开状态页 (Status Page)
  - [x] 服务可用性展示
  - [x] 历史事件时间轴/图表 (Recharts)
- [x] UI/UX 现代化重构
  - [x] 引入 Framer Motion 动画
  - [x] 自定义 MUI 主题 (Modern Theme)
  - [x] 优化 Dashboard 布局
  - [x] 优化 Monitor 列表页

## Phase 7: 测试与部署
- [x] 编写核心模块单元测试 (`probe`, `services`)
- [x] Dockerfile (Backend & Frontend)
- [x] Docker Compose 编写
- [x] CI/CD 流程配置 (GitHub Actions)
- [x] 代码静态检查与规范化 (Linting)
- [x] 生产环境部署配置 (Nginx 反向代理, 双域名支持)
  - 前端: `status.w33d.xyz` (Port: 3090)
  - 后端: `status-api.w33d.xyz` (Port: 7080)
- [x] 最终检查与验证 (端口逻辑与配置一致性)
- [x] 修复前端构建错误 (Typescript & PostCSS)
- [x] 修复后端 Docker 构建错误 (Go Version Mismatch & Dependency Downgrade)
