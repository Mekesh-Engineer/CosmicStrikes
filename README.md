# 🚀 Cosmic Strikes

A full-stack arcade space shooter game built with React, Three.js, and Node.js.

## 🎮 Features

- **60 FPS Gameplay** - Smooth, responsive arcade action
- **100 Levels** - Progressive difficulty with boss battles every 10 levels
- **Wave System** - 5 waves per level with increasing challenge
- **Combo System** - Chain kills for score multipliers (1x-5x)
- **Victory Conditions** - Unlock titles: Sector Cleared, Elite Sector, Cosmic Savior
- **Leaderboards** - Global high score tracking
- **User Accounts** - Save progress and compete with friends
- **Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

### Frontend

- React 18 + TypeScript
- Redux Toolkit (state management)
- Three.js + React Three Fiber (3D graphics)
- Tailwind CSS (styling)
- Vite (build tool)

### Backend

- Node.js + Express
- SQLite (local) / MongoDB (cloud)
- JWT Authentication
- TypeScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cosmic-strikes.git
cd cosmic-strikes

# Install all dependencies
npm run install-all

# Start development servers
npm run dev
```

The game will be available at `http://localhost:5173`

### Development Commands

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Both (concurrent)
npm run dev
```

## 📦 Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Deploy ready"
git push origin main
```

### 2. Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

### 3. Set Environment Variables (Vercel Dashboard)

```
JWT_SECRET=your-production-secret-key
```

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable               | Description                  | Required             |
| ---------------------- | ---------------------------- | -------------------- |
| `JWT_SECRET`           | JWT signing key              | Yes                  |
| `PORT`                 | Backend port (default: 5000) | No                   |
| `MONGO_URI`            | MongoDB connection string    | No (SQLite fallback) |
| `FRONTEND_URL`         | Frontend URL for CORS        | No                   |
| `GOOGLE_CLIENT_ID`     | Google OAuth (optional)      | No                   |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (optional)      | No                   |

## 🎯 Game Controls

| Action | Keyboard          | Touch        |
| ------ | ----------------- | ------------ |
| Move   | Arrow keys / WASD | Swipe        |
| Fire   | Space (manual)    | Auto-fire    |
| Pause  | P / Escape        | Pause button |

## 🏆 Victory Conditions

| Level | Victory Type     | Reward                    |
| ----- | ---------------- | ------------------------- |
| 10    | Minor Victory    | "Sector Cleared"          |
| 50    | Major Victory    | "Elite Sector" title      |
| 100   | Ultimate Victory | "Cosmic Savior" + Credits |

## 📊 Loss Conditions

### Immediate Game Over

- Lives reach 0 (collision with alien)
- Boss reaches bottom of screen
- 5+ aliens escape (screen overflow)

### Soft Penalty (Combo Reset)

- Miss 3 aliens within 10 seconds
- No shots fired for 15 seconds (idle)

## 🔧 API Endpoints

| Method | Endpoint                  | Description      |
| ------ | ------------------------- | ---------------- |
| POST   | `/api/auth/register`      | Create account   |
| POST   | `/api/auth/login`         | Login            |
| POST   | `/api/auth/logout`        | Logout           |
| GET    | `/api/auth/me`            | Get current user |
| POST   | `/api/scores`             | Submit score     |
| GET    | `/api/scores/leaderboard` | Get leaderboard  |
| GET    | `/api/status`             | Health check     |

## 📁 Project Structure

```
cosmic-strikes/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── features/      # Redux slices
│   │   ├── pages/         # Route pages
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
├── backend/               # Express API
│   ├── lib/               # Database manager
│   ├── routes/            # API routes
│   └── server.ts          # Entry point
├── api/                   # Vercel serverless
└── vercel.json            # Deployment config
```

## 📄 License

MIT License

---

Built with ❤️ for the love of arcade games

## Notes

- Replace `public/cosmic-bg.glb` with a real nebula model.
- Account widget shows simple login/logout links.
- Scores API supports listing and posting with auth.
