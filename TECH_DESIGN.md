# 服务可用性监控平台技术方案

## 1. 项目概述
本项目旨在构建一个高可用的服务监控平台，提供服务健康状态检测、实时告警通知以及公开状态页展示功能。平台采用前后端分离架构，后端负责核心调度与探测，前端提供管理后台和公众展示页面。

## 2. 系统架构

### 2.1 架构拓扑
系统包含以下核心组件：
- **前端 (Frontend)**:
  - **管理仪表板 (Admin Dashboard)**: 用于配置监控项、查看详细指标、管理用户与通知渠道。需鉴权。
  - **公开状态页 (Public Status Page)**: 面向公众展示服务实时状态与历史可用性。无需鉴权。
- **后端 (Backend)**:
  - **API 服务**: 提供 RESTful 接口。
  - **探测调度引擎**: 定时触发探测任务。
  - **探测插件模块**: 执行具体的探测逻辑 (HTTP, Ping, TCP, DNS)。
  - **通知模块**: 处理事件并分发告警。
- **数据存储 (Storage)**:
  - **PostgreSQL**: 存储配置、用户信息、历史事件、探测结果。
  - **Redis (Optional)**: 用于任务队列、缓存状态页数据。

### 2.2 技术选型
- **语言**: Golang (后端), React/Vue (前端).
- **数据库**: PostgreSQL.
- **缓存/队列**: Redis.
- **通信**: HTTP RESTful API.

## 3. 核心模块设计

### 3.1 API 服务模块
- 提供 `/api` 前缀的 RESTful 接口。
- 负责请求路由、参数校验、身份认证 (JWT) 与权限控制 (RBAC)。

### 3.2 探测调度引擎
- 扫描启用的监控项，基于 Cron 或 Interval 生成任务。
- 支持并发执行探测任务。
- 收集探测结果，判断状态变更（Up -> Down, Down -> Up）。

### 3.3 探测插件机制 (Probe Plugins)
- 定义 `ProbePlugin` 接口：`RunCheck(config) Result`。
- 内置插件：
  - **HTTP/HTTPS**: 检查状态码、响应时间、内容匹配。
  - **TCP**: 检查端口连通性。
  - **ICMP Ping**: 检查丢包率与延迟。
  - **DNS**: 检查域名解析结果。

### 3.4 通知管理模块
- 定义 `NotifierPlugin` 接口。
- 支持渠道：Email (SMTP), Webhook, Telegram, Slack, etc.
- 策略：防抖动、重试、故障升级。

### 3.5 状态页发布模块
- 提供公开只读 API。
- 支持服务分组展示。
- 展示历史事件与可用率。

## 4. 数据库设计 (Schema)

### 4.1 核心表结构
- **users**: 用户信息 (`username`, `password_hash`, `role`).
- **monitors**: 监控项配置 (`type`, `target`, `interval`, `expected_status`, `is_public`).
- **monitor_groups**: 服务分组 (`name`, `order`).
- **check_results**: 探测日志 (`monitor_id`, `status`, `response_time`, `message`). *考虑定期归档*
- **incidents**: 故障事件 (`monitor_id`, `status`, `start_time`, `end_time`, `impact`).
- **notification_channels**: 通知渠道配置 (`type`, `config`).
- **monitor_channel_subscriptions**: 监控项与通知渠道关联 (`monitor_id`, `channel_id`).

## 5. API 接口设计

### 5.1 认证 (Auth)
- `POST /api/auth/login`
- `GET /api/auth/profile`

### 5.2 监控管理 (Monitors)
- `GET /api/monitors`
- `POST /api/monitors`
- `GET /api/monitors/{id}`
- `PUT /api/monitors/{id}`
- `DELETE /api/monitors/{id}`

### 5.3 公开状态页 (Public)
- `GET /api/public/status`: 获取分组及服务状态。
- `GET /api/public/history`: 获取历史事件。

## 6. 扩展性设计
- **插件化**: 探测器与通知器均通过接口实现，易于扩展新类型。
- **模块解耦**: 调度、执行、通知通过事件或队列解耦。
