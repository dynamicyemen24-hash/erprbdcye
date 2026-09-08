# UAMEX ERP™ — Backend Deployment Guide

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Vercel     │────▶│  Render/Railway  │────▶│  Neon PostgreSQL │
│  (Frontend) │     │  (Backend API)   │     │  (Database)      │
│  erprbdcye  │     │  api.erprbdcye   │     │                  │
└─────────────┘     └──────────────────┘     └─────────────────┘
```

## Step 1: Deploy Backend to Render

### 1.1 Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 1.2 Create Web Service
1. Click **New** → **Web Service**
2. Connect GitHub repo: `NexoraOS`
3. Configure:
   - **Name:** `nexoraos-api`
   - **Region:** `Oregon` (closest to Neon)
   - **Branch:** `main`
   - **Runtime:** `Docker`
   - **Dockerfile:** `./Dockerfile`
   - **Docker Context:** `.`
   - **Health Check Path:** `/api/health/liveness`

### 1.3 Set Environment Variables on Render

Go to **Environment** tab and add:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.erprbdcyedb?sslmode=require
JWT_SECRET=<generate: openssl rand -base64 64>
JWT_REFRESH_SECRET=<generate: openssl rand -base64 64>
CORS_ORIGINS=https://erprbdcye.org,https://www.erprbdcye.org
GEMINI_API_KEY=your_gemini_key_here
LOG_LEVEL=info
AI_ENABLED=false
GEOSPATIAL_ENABLED=true
WEBHOOKS_ENABLED=true
BACKUP_ENABLED=true
```

### 1.4 Deploy
- Click **Create Web Service**
- Render will build the Docker image and deploy
- Wait for the first deploy to complete (~3-5 minutes)
- Note the Render URL: `https://nexoraos-api.onrender.com`

## Step 2: Configure Custom Domain on Render

### 2.1 Add Custom Domain
1. In Render dashboard → **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Enter: `api.erprbdcye.org`

### 2.2 Update DNS
Add to your DNS provider (where erprbdcye.org is managed):

```
Type: CNAME
Name: api
Value: nexoraos-api.onrender.com
TTL: 3600
```

### 2.3 SSL Certificate
- Render auto-provisions SSL for custom domains
- Wait ~10 minutes for certificate provisioning

## Step 3: Update Vercel Frontend

### 3.1 Set Backend URL in Vercel
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add:
```
VITE_API_BASE_URL=https://api.erprbdcye.org
```

### 3.2 Redeploy Frontend
- Vercel auto-deploys on push to `main`

## Step 4: Verify Deployment

### 4.1 Health Check
```bash
curl https://api.erprbdcye.org/api/health/liveness
# Should return: {"status":"ok"}

curl https://api.erprbdcye.org/api/health/readiness
# Should return: {"status":"ok","checks":{"database":"ok"}}
```

### 4.2 CORS Test
```bash
curl -I -X OPTIONS https://api.erprbdcye.org/api/v2/auth/login \
  -H "Origin: https://erprbdcye.org" \
  -H "Access-Control-Request-Method: POST"
# Should return: Access-Control-Allow-Origin: https://erprbdcye.org
```

### 4.3 Login Test
```bash
curl -X POST https://api.erprbdcye.org/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
# Should return JWT tokens
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token secret (min 64 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret (min 64 chars) |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed origins |
| `GEMINI_API_KEY` | ❌ | Google AI key for features |
| `LOG_LEVEL` | ❌ | `debug`, `info`, `warn`, `error` |
| `AI_ENABLED` | ❌ | Enable AI features |
| `GEOSPATIAL_ENABLED` | ❌ | Enable map features |
| `WEBHOOKS_ENABLED` | ❌ | Enable webhook system |
| `BACKUP_ENABLED` | ❌ | Enable backup system |

## Generate Secure Secrets

```bash
# Generate JWT secrets
openssl rand -base64 64
```

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGINS` includes `https://erprbdcye.org`
- Check that the frontend is sending the correct `Origin` header

### Database Connection Failed
- Verify `DATABASE_URL` is correct
- Ensure Neon database is running
- Check that `sslmode=require` is in the connection string

### 502 Bad Gateway
- Check Render logs: Dashboard → Logs
- Ensure `PORT=3000` is set
- Verify the Docker build succeeded

## Cost Estimate

| Service | Plan | Cost/Month |
|---------|------|------------|
| Render (Backend) | Starter | $7 |
| Neon (Database) | Free tier | $0 |
| Vercel (Frontend) | Hobby | $0 |
| **Total** | | **~$7/month** |

## Scaling

When traffic grows:
1. Upgrade Render to Standard ($25/mo) for more RAM/CPU
2. Upgrade Neon to Pro ($19/mo) for more connections
3. Add Redis on Render ($7/mo) for rate limiting
