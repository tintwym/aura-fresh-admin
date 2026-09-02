# Admin dashboard (`admin/`)

Next.js store operations UI (products, orders, MMK pricing).

**Customer shop** → `../frontend`

## Local dev

```bash
# API on :8080
npm install
npm run dev
```

→ http://127.0.0.1:3001

Login: `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD` from `../backend/.env`.

## Vercel

1. Import repo → set **Root Directory** to `admin`
2. Framework: Next.js (auto-detected)
3. Set `API_PROXY_TARGET=https://YOUR-API-HOST`
4. Set backend `APP_ADMIN_BASE_URL` to your Vercel admin URL

See root [README.md](../README.md).

## Features

- Admin JWT login
- Products CRUD (category + expiry for meat/dairy)
- Orders + status updates
- Prices in **Ks (MMK)** only
