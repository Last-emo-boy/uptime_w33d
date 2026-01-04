# Uptime W33d 埋点 (Push Monitor) 接入规范

本规范定义了外部服务如何通过 API 主动向 Uptime W33d 汇报状态（Heartbeat/Keep-alive）。这适用于监控定时任务（Cron Jobs）、后台工作进程或处于防火墙内部无法被外部直接探测的服务。

## 1. 核心概念

*   **Push Monitor**: 一种被动接收状态的监控项。系统不主动探测目标，而是等待目标主动发送 HTTP 请求。
*   **Heartbeat**: 外部服务发送的“我还活着”的信号。
*   **Grace Period (宽限期)**: 允许心跳延迟到达的最大时间。如果 `当前时间 - 上次心跳时间 > (检测间隔 + 宽限期)`，系统将判定服务为 **DOWN**。

## 2. 接口规范

### 2.1 发送心跳 (Heartbeat)

外部服务应定期调用此接口。

*   **Endpoint**: `GET /api/push/:push_token`
*   **Method**: `GET` (推荐) 或 `POST`

#### 请求参数 (Query Parameters)

| 参数名 | 类型 | 必填 | 描述 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| `status` | string | 否 | 状态，默认为 `up`。可选值: `up`, `down` | `up` |
| `msg` | string | 否 | 附加消息，用于记录日志 | `Backup completed successfully` |
| `ping` | int | 否 | 耗时（毫秒），用于统计性能 | `120` |

#### 示例

**使用 curl (Shell):**

```bash
# 简单的存活汇报
curl "https://uptime.example.com/api/push/a1b2c3d4e5f6?status=up"

# 汇报任务完成及耗时
curl "https://uptime.example.com/api/push/a1b2c3d4e5f6?status=up&msg=DB_Backup_Done&ping=450"

# 汇报失败
curl "https://uptime.example.com/api/push/a1b2c3d4e5f6?status=down&msg=Disk_Full"
```

**使用 Python:**

```python
import requests

# 任务成功
requests.get("https://uptime.example.com/api/push/a1b2c3d4e5f6", params={
    "status": "up",
    "msg": "Data processed",
    "ping": 200
})
```

### 2.2 响应 (Response)

*   **Status Code**: `200 OK`
*   **Body**:
    ```json
    {
      "ok": true
    }
    ```

## 3. 最佳实践

1.  **Cron Job 监控**:
    *   在 Crontab 命令末尾添加 curl 调用。
    *   `0 0 * * * /path/to/backup.sh && curl "https://uptime.../push/TOKEN?msg=Success" || curl "https://uptime.../push/TOKEN?status=down&msg=Failed"`
2.  **应用启动/关闭埋点**:
    *   在应用启动时发送 `status=up&msg=Started`。
    *   在应用优雅关闭时发送 `status=down&msg=Stopped`（这会立即触发告警，如果你配置了 Down 通知）。
3.  **错误处理**:
    *   建议在埋点请求加上超时设置，避免监控系统本身的故障影响业务主流程。

## 4. 安全建议

*   **Token 保密**: `push_token` 等同于认证凭证，请勿泄露。
*   **HTTPS**: 务必使用 HTTPS 协议调用接口，防止 Token 被劫持。
