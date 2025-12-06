# 🌾 AgriGPT

**AI-Powered Agricultural Consultant** – Multimodal RAG system for crop disease detection and government scheme information.

![Version](https://img.shields.io/badge/version-2.0.0-green)


---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| 🔬 **Disease Detection** | Upload crop photos → AI diagnoses diseases with treatment recommendations |
| � **Knowledge Base** | Ingest agricultural PDFs into vector database for semantic search |
| 🏛️ **Scheme Finder** | Query government support programs for farmers |
| 🔐 **Authentication** | Supabase-powered user login/signup with JWT tokens |
| 👑 **Admin Panel** | Role-based access – only admins can upload documents |
| 🛡️ **Security** | Rate limiting, prompt guardrails, CORS protection |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                 │
├─────────────────────────────────────────────────────────────────┤
│  Auth  │  ChatWindow  │  FileUpload  │  ErrorBoundary          │
│  Login/Signup │ Text + Image Chat │ PDF Upload (Admin only)    │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API + JWT
┌────────────────────────────▼────────────────────────────────────┐
│                        BACKEND (FastAPI)                        │
├─────────────────────────────────────────────────────────────────┤
│  Routes:       /auth/*  │  /crops/*  │  /schemes/*             │
│  Security:     JWT Auth │ Rate Limit │ Prompt Guards           │
│  Service:      AgriService (CLIP + Gemini + Pinecone)          │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   ┌─────────┐         ┌──────────┐        ┌──────────┐
   │ Gemini  │         │ Pinecone │        │ Supabase │
   │ Vision  │         │ (Vector) │        │  (Auth)  │
   │  + LLM  │         │ 2 Indexes│        │   JWT    │
   └─────────┘         └──────────┘        └──────────┘
```

---

## 📁 Project Structure

```
agrigpt/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py        # /auth/check-admin, /auth/me
│   │   │   ├── crops.py       # /crops/upload, /crops/ask
│   │   │   └── schemes.py     # /schemes/upload, /schemes/query
│   │   ├── services/
│   │   │   └── agri_service.py # CLIP + Gemini Vision + RAG
│   │   ├── config.py          # Environment configuration
│   │   ├── models.py          # Pydantic request/response models
│   │   └── security.py        # JWT auth, rate limiting, guardrails
│   ├── main.py                # FastAPI app entry point
│   ├── requirements.txt
│   └── render.yaml            # Render deployment config
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/          # Login/Signup UI
│   │   │   ├── ChatWindow/    # Chat interface
│   │   │   ├── ChatMessage/   # Message bubbles
│   │   │   ├── FileUpload/    # PDF upload dropzone
│   │   │   ├── ErrorBoundary/ # React error handling
│   │   │   └── Header/        # App header
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Supabase auth state
│   │   ├── lib/
│   │   │   └── supabase.js    # Supabase client
│   │   ├── utils/
│   │   │   └── api.js         # API helpers + headers
│   │   ├── App.jsx            # Main app component
│   │   └── index.css          # Notion-inspired CSS
│   ├── vercel.json            # Vercel deployment config
│   └── package.json
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- API Keys: Google AI, Pinecone, Supabase

### Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

Create `.env`:
```env
GOOGLE_API_KEY=your_google_api_key
PINECONE_API_KEY=your_pinecone_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_URL=https://your-project.supabase.co
ADMIN_EMAILS=admin@email.com
CROP_INDEX_NAME=agrigpt-crops
SCHEMES_INDEX_NAME=agrigpt-schemes
```

Run:
```bash
uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger UI)
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Run:
```bash
npm run dev
# → http://localhost:5173
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/auth/check-admin` | 🔐 User | Check if user is admin |
| GET | `/auth/me` | 🔐 User | Get current user info |

### Crop Data
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/crops/upload` | 👑 Admin | Upload crop disease PDF |
| POST | `/crops/ask` | 🔐 User | Chat with AI (text + image) |

### Government Schemes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/schemes/upload` | 👑 Admin | Upload schemes PDF |
| POST | `/schemes/query` | 🔐 User | Query schemes (text only) |

### System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ None | Health check |

---

## 🔒 Security Features

| Feature | Implementation |
|---------|----------------|
| **Authentication** | Supabase JWT with signature verification |
| **Authorization** | Role-based (User vs Admin) |
| **Rate Limiting** | 5 uploads/min, 20 queries/min per IP |
| **Prompt Guards** | Regex-based injection detection |
| **CORS** | Configurable origin whitelist |
| **Env Validation** | Startup check for required keys |

---

## ☁️ Deployment

### Backend → Render

1. Push to GitHub
2. Create **Web Service** on [Render](https://render.com)
3. Set **Root Directory**: `backend`
4. Add environment variables:
   - `GOOGLE_API_KEY`
   - `PINECONE_API_KEY`
   - `SUPABASE_JWT_SECRET`
   - `SUPABASE_URL`
   - `ADMIN_EMAILS`
   - `ENVIRONMENT=production`
5. Deploy!

### Frontend → Vercel

1. Push to GitHub
2. Import to [Vercel](https://vercel.com/new)
3. Set **Root Directory**: `frontend`
4. Add environment variables:
   - `VITE_API_URL` = Your Render URL
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy!

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, CSS3 |
| **Backend** | FastAPI, Python 3.11, Pydantic |
| **AI/ML** | Gemini Vision, Gemini 2.5 Flash, CLIP |
| **Vector DB** | Pinecone (2 indexes: crops, schemes) |
| **Auth** | Supabase (email/password) |
| **Deployment** | Render (backend), Vercel (frontend) |


---

<div align="center">
  <p>Built with 💚 for farmers</p>
  <p><strong>AgriGPT</strong> – Making AI accessible for agriculture</p>
</div>
