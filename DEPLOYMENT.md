# AIIA Clinical Trials Management System (CTMS) — Deployment Guide

This guide covers all options for running and hosting the AIIA CTMS platform: from running on **localhost**, to generating an **instant live HTTPS tunnel**, to **free cloud hosting on Render or Vercel**.

---

## 1. Localhost Execution (Active Now)

Both servers are currently running and configured on your machine:

| Component | URL | Purpose |
|---|---|---|
| **Frontend UI (Dev)** | [http://localhost:5173](http://localhost:5173) | Vite development server with Hot Module Reloading |
| **Unified Web App** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | Single-server mode (FastAPI serving built React SPA) |
| **Interactive API Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Swagger OpenAPI interactive documentation |
| **Health Check** | [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health) | System health & DB connection status probe |

### One-Click Starter:
Double-click `run_localhost.bat` in the project root anytime to spin up both servers automatically.

### Demo Login Credentials:
Default Password for all accounts: **`Password@AIIA2026!`**

- **Admin:** `admin`
- **Principal Investigator:** `investigator`
- **Study Coordinator:** `coordinator`
- **Clinical Trial Monitor:** `monitor`
- **Ethics Committee:** `ethics`
- **Pharmacovigilance Officer:** `pharmacovigilance`
- **Regulator:** `regulator`

*(Quick Note: The login screen contains 1-click quick-fill buttons for each role).*

---

## 2. Instant Live Public Tunnel (Shareable HTTPS URL in 60s)

If you need to show the live app to evaluators, team members, or hackathon judges immediately without waiting for cloud builds:

Run the following command in PowerShell:
```powershell
npx -y localtunnel --port 8000
```
This gives you a public HTTPS URL (e.g. `https://quiet-tree-42.loca.lt`) pointing directly to your running CTMS instance on port 8000!

---

## 3. Cloud Deployment: Render.com (Recommended Free Cloud Hosting)

Deploy the unified application (FastAPI + React SPA) on Render's free tier.

### Step 1: Push Project to GitHub
```bash
git init
git add .
git commit -m "feat: complete AIIA CTMS production deployment setup"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

### Step 2: Deploy on Render
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Environment:** `Python`
   - **Region:** Any (e.g., Oregon or Frankfurt)
   - **Branch:** `main`
   - **Build Command:**
     ```bash
     cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt && python -m app.database.init_db
     ```
   - **Start Command:**
     ```bash
     cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Environment Variables:**
     - `PYTHON_VERSION`: `3.11.9`
     - `NODE_VERSION`: `20.11.0`
     - `ENVIRONMENT`: `production`
     - `DATABASE_URL`: `sqlite:///./aiia_ctms.db`
5. Click **Deploy Web Service**.
6. Render will build the React SPA, seed the database, and launch the unified server at `https://<your-app-name>.onrender.com`.

---

## 4. Split Deployment: Vercel (Frontend) + Render (Backend)

If you prefer Vercel for frontend:

### Backend on Render:
1. Deploy `backend` directory to Render with:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt && python -m app.database.init_db`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. Copy your backend URL: e.g. `https://aiia-backend.onrender.com`.

### Frontend on Vercel:
1. Import repository in [Vercel Dashboard](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Add Environment Variable:
   - `VITE_API_URL`: `https://aiia-backend.onrender.com/api/v1`
5. Click **Deploy**.

---

## 5. Docker Container Deployment

To run in a containerized environment (AWS ECS, Google Cloud Run, Azure, or VPS):

```bash
# Build the production image
docker build -t aiia-ctms:latest .

# Run the container
docker run -d -p 8000:8000 --name ctms-app aiia-ctms:latest

# Or using docker-compose
docker-compose up -d
```
Access at `http://localhost:8000`.
