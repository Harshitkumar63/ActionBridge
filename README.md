# ⚡ ActionBridge

**Turn what you learn into what you *do* — in under 60 minutes.**

ActionBridge is a single-page web app that converts learning content (YouTube links, articles, or text) into one specific, actionable micro-task with clear steps you can start immediately.

![ActionBridge Screenshot](https://img.shields.io/badge/status-live-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework — handles routing, server-side API routes, and bundling |
| **React 19** | UI library — manages components, state, and rendering |
| **CSS Modules** | Scoped styling — each component gets its own `.module.css` file so styles don't clash |
| **Groq API** | AI inference — sends prompts to the LLaMA 3.1 8B model and gets structured JSON responses |
| **LLaMA 3.1 8B** | The AI model (hosted by Groq) that generates actionable tasks from user input |
| **Node.js** | Runtime — runs the Next.js dev server and API routes on your machine |

### How it works (architecture):

```
User Input (browser)
    │
    ▼
Next.js Frontend (React)  ──  page.js + page.module.css
    │
    │  POST /api/generate
    ▼
Next.js API Route (server)  ──  route.js
    │
    │  Sends prompt to Groq API
    ▼
Groq Cloud (LLaMA 3.1 8B)
    │
    │  Returns structured JSON
    ▼
Frontend renders: TASK → STEPS → OUTCOME → DIFFICULTY
```

### Key files:

| File | What it does |
|---|---|
| `src/app/page.js` | Main UI — input box, result cards, checklist, difficulty buttons |
| `src/app/page.module.css` | All styling — dark theme, animations, cards, checklist |
| `src/app/api/generate/route.js` | Backend API — sends AI prompt to Groq, parses response |
| `src/app/layout.js` | Page layout wrapper, meta tags, font imports |
| `src/app/globals.css` | Global styles — CSS variables, colors, typography |
| `.env.local` | Your secret API key (never uploaded to GitHub) |

---

## 🚀 How to Run

### Prerequisites

- **Node.js** (v18 or newer) — [Download here](https://nodejs.org/)
- **Groq API Key** (free) — [Get one here](https://console.groq.com/keys)

### Step-by-step setup:

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/actionbridge.git

# 2. Go into the project folder
cd actionbridge

# 3. Install dependencies
npm install

# 4. Create your environment file
#    Copy the example file and add your real API key
cp .env.example .env.local
```

Now open `.env.local` in any text editor and replace the placeholder with your real key:

```env
GROQ_API_KEY=gsk_your_actual_api_key_here
```

Then start the app:

```bash
# 5. Start the development server
npm run dev
```

Open your browser and go to: **http://localhost:3000**

That's it! 🎉

---

## 📋 Features

- **AI-Powered Task Generation** — Paste what you learned, get a specific 30–60 minute task
- **Interactive Checklist** — Click "Start Now" to track your progress step by step
- **Difficulty Adjustment** — "Make it easier" / "Make it harder" buttons to regenerate at different levels
- **Completion Celebration** — Finish all steps and get a 🎉 congratulations banner
- **Clean Dark UI** — Glassmorphism cards, smooth animations, responsive design

---

## ⚠️ Important Notes

- The `.env.local` file contains your secret API key. **Never share it or commit it to GitHub.**
- The `.env.example` file is a safe template that shows what keys are needed (this one IS committed).
- If the app shows "Groq API key is not configured", check that your `.env.local` file has `GROQ_API_KEY=...` (not `OPENAI_API_KEY`).
- After changing `.env.local`, you must **restart the server** (`Ctrl+C` then `npm run dev`).
