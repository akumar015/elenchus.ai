# Elenchus.ai — End-to-End Product Walkthrough & Demo Guide

> **Target Audience:** Hackathon Judges, Evaluators, and Curious Thinkers  
> **Core Premise:** *"We think the best way to actually understand an idea is to argue about it."*

---

## Walkthrough Roadmap

```
1. Landing Page (/)               2. Editorial Docs (/about & /architecture)
   ├── Cymatic Audio Canvas          ├── The Core Manifesto
   ├── 4 Cognitive Retention Steps   └── System Topology & Technical BOM
   └── Sovereign Google Auth
              │
              ▼
3. Studio Hub (/studio)
   ├── Conversational Format (Podcast vs Sparring)
   ├── Multilingual Indic Dialects (EN · HI · PA · TE)
   ├── Curated Mental Models (6 Core Dossiers)
   ├── Bring Your Own Spark (URL / Thesis Ingestion)
   └── Sovereign Thought Vault (Local-First Storage)
              │
              ▼
4. Live Dialectic Arena (/spar/[topic])
   ├── Studio Presence Bar & Soundwave Equalizers
   ├── Mutex-Locked Audio Pipeline (Gnani.ai Timbre v3.0)
   ├── Central Reactive Voice Orb (Push-to-Talk / Spacebar)
   └── Turn-Taking Dialogue Feed (Anchor vs Provocateur vs You)
              │
              ▼
5. Post-Debate Synthesis
   ├── AI Scribe Distillation (Thesis, Stance, Blind Spots, Synthesis)
   ├── Atomic Thought Card Generation
   └── 1-Click Export (Obsidian/Notion Markdown & JSON)
```

---

## Step 1 — The Landing Experience (`/`)

### What to Showcase
- **Procedural Cymatic Canvas:** As you scroll, the background cymatic soundwave reacts dynamically to scroll progress, simulating acoustic resonance.
- **Top Editorial Navigation:** Clean monospace branding `(elenchus.ai)` with links to `about`, `architecture`, and `Sign In`.
- **Sovereign Authentication:** Click **Sign In**. Notice the Google OAuth popup. It syncs the user's name (`Thinker`) without storing passwords or telemetry on any remote database.
- **The 4 Cognitive Retention Feature Sections:**
  1. *Socratic Cross-Examination:* Demonstrating the 4-stage impasse engine (Thesis &rarr; Cross-Exam &rarr; Aporia &rarr; Synthesis).
  2. *3-Way Studio Roundtable:* Moving beyond single-chatbot interaction to a dynamic where you sit between an Anchor and a Provocateur.
  3. *Indic Code-Switching Prosody:* Genuine colloquial bilingual cadence rather than translated mechanical English.
  4. *Sovereign Atomic Thought Cards:* Archiving synthesized insights directly to your local device.
- **Call-to-Action:** Click **Enter Studio &rarr;** to transition seamlessly to `/studio`.

---

## Step 2 — Exploring System Design & Manifesto

### Route A: `/about` (The Philosophical Manifesto)
- **Hero:** *"We think the best way to actually understand an idea is to argue about it."*
- **Why We Exist:** Tackling passive content consumption and cognitive erosion.
- **How It Feels:** Clean 4-step breakdown of daily drops, dual modality, custom spark ingestion, and sovereign archival.
- **Zero-Slop Design:** Serif typography (Newsreader), warm paper palette (`#fbfbf9`), no generic gradients or emoji clutter.

### Route B: `/architecture` (The Technical Blueprint)
- **Runtime Topology Map:** Visual ASCII diagram showing Next.js 14 &rarr; FastAPI &rarr; Gemini 3.5 Flash Lite & Gnani.ai Timbre v3.0.
- **The 4 Engineering Pillars:**
  1. *Multi-Agent Dialectic Runtime:* Gemini turn routing and few-shot anti-sycophancy anchors.
  2. *Bilingual Indic Voice & Concurrency Control:* `audioManager.ts` sequential mutex queue preventing audio overlap.
  3. *Context Grounding & Bring Your Own Spark:* Markdown dossiers + BeautifulSoup4 live scraping.
  4. *Sovereign Archival:* 100% client-side `localStorage` data sovereignty.
- **Stack at a Glance:** Detailed technical specifications table.

---

## Step 3 — The Dialectical Studio Hub (`/studio`)

The central control room for configuring how you want to think.

### Feature 1: Format & Dialect Controller
1. **Conversational Format Selector:**
   - **Podcast Studio [3-Way Roundtable]:** You join Kalpana (Anchor) and Avinash (Provocateur) for a live studio debate.
   - **Sparring Arena [1-on-1 Duel]:** Direct adversarial cross-examination pushing for an intellectual impasse.
2. **Indic Language Selector:**
   - **EN (Indian English):** Voiced by Kalpana & Avinash.
   - **HI (Hinglish):** Voiced by Shivani & Avinash with authentic Hindi-English code-switching.
   - **PA (Punjabi):** Voiced by Tarika & Avinash using Gurmukhi script and natural prosody.
   - **TE (Telugu):** Voiced by Lakshmi & Avinash.

### Feature 2: Curated Mental Models (Daily Drops)
- Hover over the daily cards: **Survivorship Bias**, **Hedonic Treadmill**, **Dunning-Kruger Effect**, **Tragedy of the Commons**, **Opportunity Cost**, and **Overton Window**.
- Point out the category tags (`[ COGNITIVE SCIENCE ]`, `[ BEHAVIORAL ECONOMICS ]`) and the live cast indicators (`Kalpana & Avinash · You`).
- Highlight that each model is backed by a custom markdown dossier grounded in historical paradoxes (e.g., Abraham Wald's 1943 WWII bomber analysis).

### Feature 3: Bring Your Own Spark (On-The-Fly Synthesis)
- Test entering an external URL or raw belief into the input bar:
  - *Example URL:* `https://paulgraham.com/lesson.html`
  - *Example Premise:* *"Can moral agency exist without free will?"*
- Click **Synthesize Debate**. The backend scrapes the text with BeautifulSoup4, extracts the core thesis and opening adversarial traps via Gemini, and launches an instant custom debate.

### Feature 4: Sovereign Archival Vault
- Scroll down to **My Thought Cards Vault**.
- Notice the modality filters: `[ ALL ]`, `Podcast`, `Sparring`.
- Instant full-text search across all saved theses and insights.
- Click **Export Vault (.JSON)** to trigger a local backup.

---

## Step 4 — Entering the Live Arena (`/spar/[topic]`)

Click **Enter Studio &rarr;** on **Survivorship Bias** in **English** mode.

### Visual & Interactive Highlights:
1. **Studio Header & Presence Bar (Left Column):**
   - Active beat indicator: `BEAT 01`.
   - Real-time soundwave equalizers on host cards animating when that specific host speaks.
   - Clear speaker role tags: `Anchor · Kalpana`, `Provocateur · Avinash`, `Guest Thinker · You`.
2. **Synchronized Transcript Feed:**
   - Spoken dialogue appears in real-time cards with speaker labels (clean, unadorned, no square brackets or emojis).
   - Topic insight banners highlighting dialectic paradoxes.
   - Restrained pulsing dot when hosts are formulating their next turn.
3. **Studio Control Desk & Voice Orb (Right Column):**
   - Central interactive Voice Orb pulses to microphone volume levels.
   - Status transitions:
     - `WEIGH IN (HOLD SPACEBAR OR TAP)`
     - `TRANSMITTING PREMISE · RELEASE TO SEND`
     - `KALPANA ON AIR · THE ANCHOR` / `AVINASH ON AIR · THE PROVOCATEUR`
   - Zero icon clutter below the mic button.
   - Text fallback rebuttal box at the bottom for silent typing.
4. **Audio Mutex Lock Demonstration:**
   - When Kalpana and Avinash speak back-to-back, the audio engine plays segment 1 completely before segment 2 begins — zero overlap, zero cutoff.
   - If browser autoplay security pauses the audio, a clean one-click banner appears: *"Browser paused conversational audio. Click to hear interlocutors."*

---

## Step 5 — The Debate Flow (Testing Dialogue)

To demonstrate how the AI pushes back and avoids sycophancy, try these 3 sample volleys:

| Turn | Speaker | Spoken Argument / Dialogue |
|:---|:---|:---|
| **Intro** | Kalpana | Sets the Wald Bomber Paradox: *"Why do we obsess over copying CEO morning routines when 99% of people who do that fail?"* |
| **Intro** | Avinash | Pushes back immediately: *"Because base-rate cynicism leads to paralysis! Believing you can win is the price of admission."* |
| **User (Volley 1)** | You | *"If successful people all share certain habits, adopting those habits mathematically increases your odds."* |
| **Response** | Hosts | Kalpana attacks the causal link (correlation vs causation). Avinash challenges whether you'd play Russian roulette if 5 out of 6 walked away rich. |
| **User (Volley 2)** | You | *"I concede the bomber paradox. We only see the bullet holes on the planes that returned."* |
| **Response** | Hosts | The engine registers your concession and advances toward the synthesis phase. |

---

## Step 6 — Scribe Synthesis & Thought Card Archival

1. Click **Conclude** in the top right corner.
2. The session ends, ephemeral Gemini context caches are deleted, and the AI Scribe (`scribe.py`) evaluates the entire dialogue history.
3. **The Atomic Thought Card Modal Opens:**
   - **01 / Core Thesis:** The foundational paradox of the topic.
   - **02 / Your Stance:** The specific claims and concessions you made.
   - **03 / Blind Spots:** Unexamined assumptions or logical fallacies surfaced during debate.
   - **04 / Key Synthesis:** The refined insight that survived the clash.
4. **Export Demonstration:**
   - Click **Export Markdown (.md)**: Downloads an Obsidian/Notion-compatible file with callouts (`> [!NOTE]`, `> [!WARNING]`, etc.).
   - Click **Return to Studio Hub**: The newly generated card is immediately visible and searchable in your local **Thought Vault**.

---

## Quick Reference: Verification Commands

```powershell
# 1. Automated 3-turn debate test (CLI)
.\.venv\Scripts\python.exe test_scripts\test_survivorship_bias.py --auto

# 2. Interactive terminal debate
.\.venv\Scripts\python.exe test_scripts\test_survivorship_bias.py --interactive

# 3. Frontend lint check
cd frontend; npm run lint

# 4. Backend health probe
curl.exe -s http://127.0.0.1:8000/health
```
