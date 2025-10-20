## EZ-ERP Docker Deployment (Local MongoDB on ECS)

### 1) Prerequisites
- **Docker** and **Docker Compose** installed
- Local MongoDB runs as a Docker service via docker-compose
- Frontend and backend domains (or use server IPs for testing)

### 2) Configure Environment
Create a `.env` file at the repository root (same directory as `docker-compose.yml`). Use `env.example` as a template.

Key variables:
- **MONGODB_URI**: Use the internal Docker hostname:
  - `mongodb://mongo:27017/ez-erp`
- **CORS_ORIGINS**: Comma-separated list of allowed origins for cookies.
- **TRUST_PROXY**: `1` when behind a load balancer or reverse proxy.
- **VITE_API_URL**: Public URL that the browser uses to call the backend (must end with `/api`).

### 3) Build and Run
```
docker compose build
docker compose up -d
```

- Frontend: `http://<server>:${FRONTEND_PORT}`
- Backend: `http://<server>:${BACKEND_PORT}`

### 4) HTTPS and Cookies
- When using HTTPS (recommended for internet-facing deployments), cookies must be `Secure` and `SameSite=None`. Backend enables these in production by default; override with `COOKIE_SECURE` and `COOKIE_SAMESITE` if needed.
- If behind a reverse proxy/load balancer, ensure it sets `X-Forwarded-Proto` and set `TRUST_PROXY=1` in `.env`.

### 5) Troubleshooting
- Sessions not persisting:
  - Verify `CORS_ORIGINS` contains the exact origin of your site
  - Check `Set-Cookie` shows `Secure` and `SameSite=None` (with HTTPS)
  - Ensure `TRUST_PROXY=1` when behind a proxy
- DB connection issues: test from inside the backend container:
```
docker exec -it ez-erp-backend sh
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(()=>console.log('ok')).catch(console.error)"
```

### 6) Single-domain Option
If serving everything on one domain, you can proxy `/api` via the frontend Nginx (see `EZ-ERP-FRONTEND/nginx.conf`) and set `VITE_API_URL=/api`.


