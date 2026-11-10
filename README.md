# elenchus.ai — Socratic Voice Companion & Archival Dialectic Studio

> **"An unexamined life is not worth living."** — Socrates  
> Built for the **Gnani AI Voice Engineering Challenge**.  
> Powered by **Google Gemini 3.5 Flash Lite**, **Gnani Timbre v3.0**, and **Gnani Prisma STT**.  
> 
> 📄 **Submission 1-Page Pitch:** [SOLUTION_PITCH.md](SOLUTION_PITCH.md)  
> 🌐 **Live Deployment:** [elenchus-ai.indiasouthcentral.cloudapp.azure.com](https://elenchus-ai.indiasouthcentral.cloudapp.azure.com)  
> 💻 **GitHub Repository:** [github.com/akumar015/elenchus.ai](https://github.com/akumar015/elenchus.ai)

---

## 1. Executive Summary & Dual-Modality Paradigm

**elenchus.ai** is a real-time, voice-first dialectical companion designed to challenge human assumptions, expose unexamined premises, and preserve intellectual growth. It bifurcates into two distinct conversational modes powered by a shared acoustic and cognitive foundation:

```
                                  elenchus.ai
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
  ⚔️ SPARRING ARENA (1-on-1)                            🎙️ PODCAST STUDIO (3-Way)
  ─────────────────────────────────                     ─────────────────────────────────
  • Format: Socratic duel (AI vs. You)                  • Format: Roundtable (Host 1, Host 2, You)
  • Dynamic: Direct cross-examination                   • Dynamic: 2 Co-hosts clash; you are the guest
  • Pace: Tight, rigorous, 2-4 sentences                • Pace: Expansive, stories, organic standoffs
  • Cast: elenchus adversary                            • Cast: Kalpana/Shivani (Anchor) + Avinash (Challenger)
  • For: Mental fitness, conviction testing             • For: Immersive exploration, relaxed dialogue
```

Both engines culminate in an **Atomic Thought Card** inscribed by an Ambient Scribe, exportable directly to **Obsidian** and **Notion** or stored locally in your sovereign **Thought Cards Vault**.

---

## 2. Technical Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │             Browser (Next.js 14)             │
                       │  - Swiss / Anti-Slop Archival Interface      │
                       │  - Sequential Audio Cascade Engine           │
                       │  - Instant Push-to-Talk / Interrupt (Space)  │
                       │  - Sovereign Local Vault (localStorage)      │
                       └──────────────┬───────────────────────────────┘
                                      │ REST / WebSocket / Blobs
                                      ▼
                       ┌──────────────────────────────────────────────┐
                       │          FastAPI Backend (Python 3.11)       │
                       │  - Dual-Mode Router (/spar/start, /turn)     │
                       │  - In-Context Markdown Dossiers Loader       │
                       │  - Async Concurrency Lock (Gnani TTS)        │
                       └──────────────┬───────────────────────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ Google Gemini 3.5 FL  │ │  Gnani Timbre v3.0    │ │   Gnani Prisma STT    │
│  - 1M+ Context Window │ │  - Kalpana (en-IN)    │ │  - 16kHz PCM WAV      │
│  - In-Context Dossier │ │  - Shivani (hi-IN)    │ │  - Multi-lingual STT  │
│  - Structured JSON    │ │  - Avinash (Provoc.)  │ │  - Real-time stream   │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

---

## 3. Key Technical Innovations

### 3.1 Indic Multi-Voice Pipeline & Concurrency Lock
* **Gnani Timbre v3.0 Integration:** Leverages Gnani's expressive Indic neural voices (`Kalpana` & `Avinash` for English, `Shivani` & `Avinash` for Hinglish code-switching).
* **Async Mutex Concurrency Lock:** Wraps TTS requests in an `asyncio.Lock()` to strictly respect Gnani's 1-active-request concurrency barrier, completely eliminating upstream `HTTP 429` rate-limit errors.
* **Audio Cascading:** Multi-speaker podcast beats execute in a seamless sequential cascade: Host 1 speaks $\rightarrow$ visualizer shifts to Host 2 $\rightarrow$ floor opens to the guest with zero perceived latency.
* **Instant Interruption Affordance:** Tapping the mic or holding spacebar immediately cuts off active host audio playback and flips the interface into active listening mode.

### 3.2 Deep In-Context Topic Dossiers
Rather than relying on generic LLM prompts, elenchus injects 5,000+ word curated Markdown dossiers into Gemini 3.5 Flash Lite's 1M+ context window:
* **The Core Paradox:** The counter-intuitive ground truth.
* **Historical Case Studies:** Real historical foundations (e.g., Abraham Wald's 1943 WWII armor paradox, Brickman 1978 lottery/paralysis hedonic adaptation, G.K. Chesterton's 1929 *The Thing*).
* **Anchor Thesis vs. Provocateur Pushback:** Dual philosophical stances pre-seeded for co-host standoffs.
* **Thought Experiments:** Concrete ethical and operational dilemmas targeted directly at the guest.

### 3.3 Anti-Slop Archival UI (925studios Philosophy)
Adheres strictly to the **Anti-Slop Web Design Guide**:
* **Zero Pill Buttons:** Zero `rounded-full` stadium buttons or candy avatar discs.
* **Swiss Typographic Hierarchy:** High-contrast editorial typography pairing Playfair Display serifs, JetBrains Mono technical metadata stamps, and clean Swiss grotesque body text.
* **Physical Library Card Aesthetic:** Off-white archival cardstock (`#fefefc` and `#fbfbf9`), razor-sharp hairline borders (`border-[#0f0f10]/15`), and accession registration rules.

### 3.4 Obsidian & Notion 1-Click PKM Export
* Generates an **Atomic Thought Card** synthesizing:
  1. `[01 / ONTOLOGICAL CORE THESIS]`
  2. `[02 / ARTICULATED CONVICTION (YOUR STANCE)]`
  3. `[03 / EXPOSED BLIND SPOTS & FRACTURES]`
  4. `[04 / DISTILLED INTELLECTUAL SYNTHESIS]`
* **1-Click Markdown Copy:** Formatted with YAML frontmatter tags (`tags: [elenchus, mental-models, dialectic]`) and native callout blocks (`> [!NOTE]`, `> [!QUOTE]`, `> [!WARNING]`, `> [!TIP]`) recognized out-of-the-box by Obsidian and Notion.
* **My Thought Cards Vault:** Built directly into `/studio` using sovereign `localStorage` with real-time keyword search, modality filtering (`All`, `Podcast`, `Sparring`), card inspection modals, and bulk `.json` export.

---

## 4. Cast Directory

| Role | Voice (Timbre v3.0) | Archetype | Conversational Function |
|---|---|---|---|
| **Host 1 (The Anchor)** | `Kalpana` (en-IN)<br>`Shivani` (hi-IN) | Synthesizer & Storyteller | Warm, curious, sets historical context, shares analogies, and welcomes the guest into the conversation. |
| **Host 2 (The Provocateur)** | `Avinash` (en-IN & hi-IN) | Devil's Advocate & Pragmatist | Skeptical, sharp, fast-paced. Questions textbook assumptions, brings real-world edge cases, and challenges Host 1. |
| **You (The Guest Thinker)** | Human Audio / Text | Guest / Arbiter | Evaluates the clash, takes a side, introduces personal intuition, or arbitrates between the two hosts. |

---

## 5. Repository Structure

```
elenchus.ai/
├── backend/
│   ├── config.py                     # Environment settings (Google & Gnani API keys)
│   ├── main.py                       # FastAPI entrypoint & CORS configuration
│   ├── data/
│   │   ├── topics.json               # Curated daily drop index
│   │   └── dossiers/                 # Deep in-context Markdown knowledge layers
│   │       ├── survivorship-bias.md
│   │       ├── hedonic-treadmill.md
│   │       ├── chestertons-fence.md
│   │       ├── tragedy-of-the-commons.md
│   │       ├── dunning-kruger.md
│   │       └── goodharts-law.md
│   ├── routers/
│   │   ├── spar.py                   # Socratic & Podcast dual-mode dispatch
│   │   ├── topics.py                 # Daily drops & dossier retrieval
│   │   └── spark.py                  # On-the-fly URL & essay synthesis
│   └── services/
│       ├── podcast_engine.py         # 3-Way roundtable state machine (Gemini 3.5 Flash Lite)
│       ├── socratic_engine.py        # 1-on-1 sparring engine with flexible turn sizing
│       ├── gnani_tts.py              # Timbre v3.0 REST with async concurrency lock
│       ├── gnani_stt.py              # Prisma STT client
│       ├── scribe.py                 # Multi-speaker Ambient Scribe & ThoughtCard extractor
│       └── dossier_loader.py         # Dynamic dossier injector
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout with AuthProvider
│   │   │   ├── page.tsx              # Architectural landing page & manifesto
│   │   │   ├── studio/page.tsx       # Dedicated dialectic studio hub & lobby
│   │   │   └── spar/[topic]/page.tsx # Interactive sparring workspace & live audio cascade
│   │   ├── components/
│   │   │   ├── spar/
│   │   │   │   ├── StudioHeader.tsx      # Live broadcast presence visualizer
│   │   │   │   ├── TranscriptFeed.tsx    # Multi-speaker color-coded dialectic transcript
│   │   │   │   ├── VoiceOrb.tsx          # Speaker-aware acoustic orb visualizer
│   │   │   │   └── AtomicThoughtCard.tsx # Archival index card & PKM export
│   │   │   ├── vault/
│   │   │   │   └── ThoughtCardVault.tsx  # Sovereign thought card archive & search
│   │   │   ├── landing/              # Minimalist landing components & Google Auth
│   │   │   └── providers/            # Google OAuth Provider wrapper
│   │   ├── lib/
│   │   │   ├── api.ts                # Typed client API for backend endpoints
│   │   │   ├── store.ts              # Zustand state store with auth persistence
│   │   │   └── vaultStorage.ts       # Typed localStorage vault manager
│   │   └── types/                    # TypeScript interfaces for sessions, turns & cards
└── podcast_implementation.md         # Phased engineering roadmap
```

---

## 6. Quick Start & Setup Guide

### 6.1 Prerequisites
* Python 3.11+
* Node.js 18+ & npm
* Google Cloud Console OAuth 2.0 Client ID (Web Application)
* Google Gemini API Key (`gemini-3.5-flash-lite`)
* Gnani AI Credentials (`GNANI_ACCESS_TOKEN`, `GNANI_CUSTOMER_ID`, `GNANI_API_KEY`)

### 6.2 Backend Setup

1. Navigate to the project root and create/activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .\.venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables in `.env` (or environment):
   ```ini
   GOOGLE_API_KEY="your-google-gemini-api-key"
   GNANI_ACCESS_TOKEN="your-gnani-token"
   GNANI_CUSTOMER_ID="your-gnani-customer-id"
   GNANI_API_KEY="your-gnani-api-key"
   ```

4. Launch the FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   * Health Check: `http://127.0.0.1:8000/health` $\rightarrow$ `{"status":"ok"}`
   * API Docs: `http://127.0.0.1:8000/docs`

### 6.3 Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Configure frontend environment variables in `frontend/.env.local`:
   ```ini
   NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
   ```

3. Launch the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

---

## 7. Verification & Production Build

To verify code quality and production readiness:

```bash
# Type check & lint
cd frontend
npx tsc --noEmit
npm run lint

# Production compilation
npm run build
```
* **Build Status:** 6/6 static and dynamic routes compiled with 0 errors and 0 warnings.

---

## 8. License & Acknowledgments

* **License:** Apache 2.0
* **Designed for:** Gnani AI Voice Engineering Challenge 2026.
* **Models:** Google `gemini-3.5-flash-lite`, Gnani Timbre v3.0, Gnani Prisma STT.
