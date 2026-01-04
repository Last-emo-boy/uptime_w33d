# Uptime W33d

A self-hosted uptime monitoring system with a modern status page.

## Features
- Monitor HTTP, TCP, Ping, and Push (Heartbeat) services.
- Public Status Page with incident history and charts.
- Notification via Webhook and Email.
- Admin Dashboard for management.
- Docker & Docker Compose support.

## Development

### Prerequisites
- Go 1.23+
- Node.js 18+
- PostgreSQL
- Redis

### Setup
1. Clone the repository.
2. `go mod download`
3. `cd web && npm install`
4. Copy `.env.example` to `.env` (create one based on config).

## Deployment

### Prerequisites
- Linux Server (Ubuntu/Debian recommended)
- Docker & Docker Compose
- Nginx (Host)
- Domain names pointing to server IP

### Steps
1. Clone repo on server.
2. Run `chmod +x deploy.sh`
3. Run `./deploy.sh`

### Environment Variables
Set these in `docker-compose.yml` or `.env` file:
- `VITE_API_URL`: `https://xxx` (For Frontend build)
- `JWT_SECRET`: Secure random string
- `DB_PASSWORD`: Database password
