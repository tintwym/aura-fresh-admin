# Admin dashboard (`admin/`)

Next.js store operations UI (products, orders, MMK pricing).

**Customer shop** → `../frontend`

## Local dev

```bash
# Copy env, then start API on :8080
cp .env.example .env   # edit API_PROXY_TARGET if needed
npm install
npm run dev
```

→ http://127.0.0.1:3001

Configure the admin app in **`.env` only** (`API_PROXY_TARGET`, `NEXT_PUBLIC_API_BASE_URL`).

Login: `ADMIN_SEED_USERNAME` / `ADMIN_SEED_PASSWORD` from `../backend/.env`.

## Vercel

1. Import repo → set **Root Directory** to `admin`
2. Framework: Next.js (auto-detected)
3. Set `API_PROXY_TARGET=https://YOUR-API-HOST` (or put the same vars in `.env` for local; Vercel dashboard for deploy)
4. Set backend `APP_ADMIN_BASE_URL` to your Vercel admin URL

See root [README.md](../README.md).

## Features

- Admin JWT login
- Products CRUD (category + expiry for meat/dairy)
- Orders + status updates
- Prices in **Ks (MMK)** only
