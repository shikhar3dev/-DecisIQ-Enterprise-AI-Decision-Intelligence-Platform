# 🚀 DecisIQ Enterprise Deployment Guide

DecisIQ is packaged as a **unified fullstack service**: FastAPI serves both the analytical machine learning API (`/api/*`) and the high-performance React executive dashboard from a single port with zero CORS configuration required.

---

## 🌟 Deploy on Render (Recommended — Free Tier)

Render can build and run DecisIQ directly from your GitHub repository using the included `Dockerfile` and `render.yaml`.

### Method 1: Blueprint 1-Click (Fastest)
1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint**.
3. Connect your repository: `https://github.com/shikhar3dev/-DecisIQ-Enterprise-AI-Decision-Intelligence-Platform`.
4. Render will automatically read [`render.yaml`](render.yaml) and configure the web service.
5. Click **Apply**. DecisIQ will build and go live at `https://decisiq-platform.onrender.com`.

### Method 2: Manual Web Service
1. In Render, click **New +** → **Web Service**.
2. Select your GitHub repository.
3. Choose **Docker** as the Runtime (it will automatically use the root `Dockerfile`).
4. Select the **Free** instance type.
5. Click **Create Web Service**.

---

## 🚆 Deploy on Railway (Zero-Config)

1. Go to [Railway Dashboard](https://railway.app/).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `shikhar3dev/-DecisIQ-Enterprise-AI-Decision-Intelligence-Platform`.
4. Railway automatically detects the `Dockerfile`, builds both the frontend and backend, sets the `$PORT` environment variable, and provides a public domain (`*.up.railway.app`).

---

## 🐳 Run via Docker Locally

To run the unified container locally on your machine:

```bash
# 1. Build the production container
docker build -t decisiq-platform .

# 2. Run container on port 8000
docker run -d -p 8000:8000 --name decisiq decisiq-platform
```

Then visit [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🔍 Verification Endpoints

Once deployed, you can verify your deployment with:

- **Frontend Dashboard**: `https://<your-app-domain>/`
- **Health Check**: `https://<your-app-domain>/api/health`
- **Swagger Documentation**: `https://<your-app-domain>/docs`
- **Executive KPIs**: `https://<your-app-domain>/api/kpis`
