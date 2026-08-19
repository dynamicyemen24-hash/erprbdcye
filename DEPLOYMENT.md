# NexoraOS™ — Deployment Guide
# Domain: erprbdcye.org
# Host: Render (Backend) + Vercel (Frontend)

## ═══════════════════════════════════════════════════════════════
## Step 1: Deploy Backend to Render
## ═══════════════════════════════════════════════════════════════

1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: nexoraos
   - Region: Oregon (US West)
   - Runtime: Node
   - Build Command: npm install && npm run build
   - Start Command: node dist/server.cjs
   - Plan: Starter ($7/mo)

5. Add Environment Variables:
   - NODE_ENV = production
   - PORT = 3000
   - DATABASE_URL = postgresql://neondb_owner:npg_dIXtW6LQw8sH@ep-shiny-wind-ai4w5o0l-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require
   - JWT_SECRET = (generate a random 64-char string)
   - CORS_ORIGINS = https://erprbdcye.org,https://www.erprbdcye.org

6. Deploy and wait for build to complete
7. Note the URL: https://nexoraos.onrender.com

## ═══════════════════════════════════════════════════════════════
## Step 2: Deploy Frontend to Vercel
## ═══════════════════════════════════════════════════════════════

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework: Vite
   - Build Command: npm run build
   - Output Directory: dist

5. Add Environment Variables:
   - VITE_API_URL = https://nexoraos.onrender.com

6. Deploy

## ═══════════════════════════════════════════════════════════════
## Step 3: Configure Cloudflare DNS
## ═══════════════════════════════════════════════════════════════

1. Go to https://dash.cloudflare.com/ce1007ca229319e79c9305f0b954536a/erprbdcye.org
2. Go to DNS → Records

3. Add CNAME record:
   - Type: CNAME
   - Name: @ (or erprbdcye.org)
   - Target: cname.vercel-dns.com
   - Proxy: ON (orange cloud)
   - TTL: Auto

4. Add CNAME record for API:
   - Type: CNAME
   - Name: api
   - Target: nexoraos.onrender.com
   - Proxy: ON (orange cloud)
   - TTL: Auto

5. Add CNAME record for www:
   - Type: CNAME
   - Name: www
   - Target: cname.vercel-dns.com
   - Proxy: ON (orange cloud)
   - TTL: Auto

## ═══════════════════════════════════════════════════════════════
## Step 4: Configure Custom Domains
## ═══════════════════════════════════════════════════════════════

### Vercel (Frontend):
1. Go to Project Settings → Domains
2. Add: erprbdcye.org
3. Add: www.erprbdcye.org
4. Vercel will auto-configure SSL

### Render (Backend):
1. Go to Service Settings → Custom Domains
2. Add: api.erprbdcye.org
3. Render will auto-configure SSL

## ═══════════════════════════════════════════════════════════════
## Step 5: Update CORS and API URL
## ═══════════════════════════════════════════════════════════════

After deployment, update the frontend environment variable:
- VITE_API_URL = https://api.erprbdcye.org

Then redeploy the frontend.

## ═══════════════════════════════════════════════════════════════
## Step 6: Verify Deployment
## ═══════════════════════════════════════════════════════════════

1. Frontend: https://erprbdcye.org
2. API: https://api.erprbdcye.org/api/v2/health/readiness
3. Docs: https://api.erprbdcye.org/api/v2/docs

## ═══════════════════════════════════════════════════════════════
## Alternative: Deploy Everything on Render
## ═══════════════════════════════════════════════════════════════

If you want a simpler setup, deploy both frontend and backend on Render:

1. Use the Dockerfile provided
2. Create a Web Service on Render
3. Set:
   - Build Command: (leave empty, Docker handles it)
   - Start Command: (leave empty, Dockerfile CMD handles it)
   - Dockerfile: ./Dockerfile

4. Add custom domain: erprbdcye.org
5. Render will auto-configure SSL

## ═══════════════════════════════════════════════════════════════
## Database Migration
## ═══════════════════════════════════════════════════════════════

The database schema is auto-migrated on server startup.
No manual migration steps needed.

## ═══════════════════════════════════════════════════════════════
## Default Login
## ═══════════════════════════════════════════════════════════════

Email: admin@nexora.org
Password: Nexora@2024!

⚠️ Change this password immediately after first login!

## ═══════════════════════════════════════════════════════════════
## SSL/TLS Configuration
## ═══════════════════════════════════════════════════════════════

Cloudflare handles SSL termination. The flow is:

User → Cloudflare (SSL) → Render/Vercel (internal HTTP)

This is secure because:
1. Cloudflare encrypts traffic between user and CDN
2. Render/Vercel encrypts traffic between CDN and server
3. All sensitive data is encrypted end-to-end
