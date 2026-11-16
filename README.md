# 🧠 MindFlow AI — AI-Enabled Full-Stack Web Application

MindFlow AI is a responsive, simple, and complete AI-enabled full-stack workspace integrating a **modern React frontend**, **Express.js backend**, **persistent SQLite database (WAL mode)**, **JWT & bcrypt authentication**, **Google Gemini Generative AI**, and **1-click Cloud Deployment** ready configurations.

---

## 🌟 Key Features

### 1. 🎨 Responsive & Clean Frontend
- **Design System**: Built with modern React, Tailwind CSS, Lucide icons, and Plus Jakarta Sans typography.
- **Split-View Workspace**: Note card gallery with search, tag filters, and pinned status on the left; rich editor with real-time AI controls on the right.
- **Interactive Checklists**: AI-extracted action items turn directly into interactive, checkable task lists with live progress bars.
- **Mobile Responsive**: Adaptive drawer and floating AI trigger designed for smartphones, tablets, and desktops.

### 2. 🔐 Authentication & Session Security
- **Bcrypt Hashing**: Passwords securely hashed with salted rounds.
- **Stateless JWT Tokens**: 7-day signed JSON Web Tokens for authentication.
- **Instant 1-Click Demo**: Includes an instant demo login (`Alex Demo`) with pre-seeded sample notes so reviewers and users can test without filling forms.
- **Full Registration & Login**: User registration, credential validation, and user profile statistics (`/api/auth/me`).

### 3. 🗄️ Relational Database & Full CRUD
- **Engine**: SQLite powered by `better-sqlite3` with **Write-Ahead Logging (WAL)** enabled for concurrency and performance.
- **Zero Config**: No database server installation required — self-contained in `./data/mindflow.db`.
- **Full CRUD**:
  - Filter by category (`Work`, `Ideas`, `Study`, `Personal`, `General`)
  - Live search across titles, content, and tags
  - Pinned notes priority
  - Custom color tags and categorization

### 4. 🤖 Generative AI Integration (Google Gemini API)
Powered by official `@google/genai` with model **Gemini 4 Hydrogen** (and automated fallback):
- **✨ AI Executive Summary**: Generates 2-3 structured bullet points plus a high-impact takeaway.
- **📋 Action Items Extraction**: Parses note content and extracts actionable todos with checkboxes.
- **💡 Expand & Brainstorm**: Takes rough thoughts and elaborates into a full strategy proposal.
- **✍️ Tone Transformer**: Rewrites notes into *Professional*, *Concise*, *Bullet Points*, *Creative*, or *Casual*.
- **💬 Contextual AI Chat**: Conversational companion that answers questions grounded directly in the currently active note or knowledge base.
- **Self-Healing Simulation**: If no `GEMINI_API_KEY` is configured yet, the app gracefully runs with high-fidelity simulated outputs, ensuring zero friction out of the box!

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
    Client["React 19 + Tailwind CSS + Lucide (Vite)"] <-->|REST API + JWT| Server["Express.js 5 Backend (Node.js 22)"]
    Server <-->|SQL Queries (WAL Mode)| DB[("SQLite Database (/data/mindflow.db)")]
    Server <-->|@google/genai SDK| Gemini["Google Gemini API (gemini-4-hydrogen)"]
```

| Layer | Technologies |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js 22, Express.js 5, CORS, Dotenv |
| **Database** | SQLite (`better-sqlite3`) with WAL & indexes |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **Generative AI** | Google Gemini API (`@google/genai` >= 3.2.0) |
| **Deployment** | Docker multi-stage build, Render Blueprint, Railway, Vercel |

---

## 🚀 Quickstart (Run Locally)

### Prerequisites
- Node.js >= 18 (Node 22 recommended)
- npm >= 9

### 1. Clone & Install
```bash
git clone https://github.com/your-username/mindflow-ai.git
cd mindflow-ai
npm install
cd client && npm install && cd ..
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Optional)* Add your Google Gemini API Key in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> [!NOTE]
> If you don't have an API key yet, you can still run the app immediately! The app will run in Demo Simulation mode or you can enter your key inside the app Settings modal anytime.

### 3. Run the App

#### Single-Command Production Build & Run:
```bash
npm run build
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser!

#### Development Mode (Concurrent Vite + Express hot-reload):
```bash
npm run dev
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

---

## ☁️ Cloud Deployment Guide

MindFlow AI includes out-of-the-box configuration files for all major cloud providers.

### Option 1: Render.com (Recommended Web Service)
1. Push your repository to GitHub.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Web Service** → Select your repository.
4. Settings:
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Under **Advanced** → **Add Disk**:
   - Name: `mindflow-data`
   - Mount Path: `/app/data`
   - Size: 1 GB
6. Environment Variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `[any random secure string]`
   - `GEMINI_API_KEY`: `[your Gemini API key]`
7. Click **Create Web Service**. Render provides a free HTTPS domain!

### Option 2: Railway.app
1. Go to [Railway.app](https://railway.app) and create a project.
2. Choose **Deploy from GitHub repo**.
3. Railway automatically detects the included `Dockerfile` and `railway.json`.
4. Add environment variables: `PORT=5000`, `JWT_SECRET`, `GEMINI_API_KEY`.
5. Deploy finishes in ~2 minutes with automatic SSL certificate.

### Option 3: Docker (Any Cloud Provider)
You can deploy MindFlow AI to Google Cloud Run, AWS ECS, DigitalOcean, or any VPS using Docker:

```bash
# Build production Docker image
docker build -t mindflow-ai .

# Run container
docker run -d \
  -p 5000:5000 \
  -v mindflow_data:/app/data \
  -e GEMINI_API_KEY="your_api_key" \
  -e JWT_SECRET="your_jwt_secret" \
  --name mindflow \
  mindflow-ai
```

---

## 📡 REST API Reference

### Auth Endpoints
- `POST /api/auth/register` — Create a new account with email, name, password
- `POST /api/auth/login` — Authenticate existing user
- `POST /api/auth/demo` — Instant 1-click login as Demo User
- `GET /api/auth/me` — Retrieve active user session and statistics

### Notes Endpoints (Protected by JWT)
- `GET /api/notes` — Fetch all notes (supports `?category=Work` and `?search=query`)
- `GET /api/notes/categories` — Get category distribution counts
- `GET /api/notes/:id` — Get single note by ID
- `POST /api/notes` — Create new note
- `PUT /api/notes/:id` — Update note title, content, category, color, action items
- `PATCH /api/notes/:id/pin` — Toggle note pinned status
- `PATCH /api/notes/:id/action-items` — Toggle or update task checklist
- `DELETE /api/notes/:id` — Delete note

### Generative AI Endpoints (Protected by JWT)
- `GET /api/ai/status` — Check live Gemini API status and active model
- `POST /api/ai/summarize` — Generate executive bullet-point summary
- `POST /api/ai/action-items` — Extract checklist of actionable tasks
- `POST /api/ai/expand` — Brainstorm and expand ideas into comprehensive outlines
- `POST /api/ai/rewrite` — Rewrite note in chosen tone (`professional`, `concise`, `bullet_points`, `creative`, `casual`)
- `POST /api/ai/chat` — Contextual chat with current note or entire knowledge base

---

## 📄 License
MIT License. Created for simple, clean, and scalable AI web development.
