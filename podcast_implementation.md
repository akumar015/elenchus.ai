# elenchus.ai — Dual-Engine Architecture & Podcast Studio Implementation Plan

> **Codename:** Studio & Arena  
> **Target Models:** Google `gemini-3.5-flash-lite` | Gnani Timbre v3.0 | Gnani Prisma STT  
> **Status:** Planning / Execution Ready  

---

## 1. Executive Summary & Dual-Modality Paradigm

elenchus.ai bifurcates into two distinct dialectic experiences powered by a shared voice, knowledge, and scribe foundation:

```
                                  elenchus.ai
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
  ⚔️ SPARRING ARENA (1-on-1)                            🎙️ PODCAST STUDIO (3-Way)
  ─────────────────────────────────                     ─────────────────────────────────
  • Format: Socratic duel (AI vs. You)                  • Format: Roundtable (Host 1, Host 2, You)
  • Dynamic: Direct cross-examination                   • Dynamic: 2 Co-hosts banter; you are the guest
  • Pace: Tight, rigorous, 2-4 sentences                • Pace: Expansive, stories, organic standoffs
  • Cast: elenchus adversary                            • Cast: Kalpana/Shivani (Anchor) + Avinash (Challenger)
  • For: Mental fitness, conviction testing             • For: Immersive exploration, relaxed dialogue
```

Both engines generate an **Atomic Thought Card** upon completion via the Ambient Scribe.

---

## 2. Socratic Sparring Engine: 3-Part Redesign

While separating the podcast engine, the existing 1-on-1 sparring engine receives three critical refinements to remove user fatigue:

### Part 1: Conversational Pacing & Dynamic Warmth
* **Drop the Mandatory Every-Turn Question:** The AI is permitted to end on a philosophical observation or reflection ~40% of the time, allowing the human to jump in without feeling continuously interrogated.
* **Flexible Turn Sizing:** Expand from rigid 2-sentence caps to 3–5 sentences when establishing a paradox or introducing an analogy.
* **Warmth Arc:** Starts as a curious examiner, builds pressure as the user stakes a position, and treats rigour as mutual intellectual respect rather than personal shaming.

### Part 2: Ambient Stage Progression (Remove Checklist UI)
* **Retire `StageProgress` 5-step checklist:** Remove `"STAGE 1 OF 5: INTRO"`, progress dots, and completion-bar graphics that make the debate feel like a test.
* **Replace with Ambient Cadence:** Subtle topic status indicator (e.g., `TOPIC: SURVIVORSHIP BIAS · ARENA ACTIVE`) with organic stage shifts tracked invisibly on the backend.

### Part 3: In-Context Markdown Dossiers
* Move away from superficial 2-sentence `topics.json` entries.
* Load deep Markdown dossiers (`backend/data/dossiers/{topic}.md`) into Gemini Flash Lite’s 1M+ context window, giving the AI immediate access to historical case studies, thought experiments, and counter-intuitive paradoxes.

---

## 3. Podcast Studio Engine: 3-Way Interactive Architecture

### 3.1 The Studio Cast

| Role | Voice (Timbre v3.0) | Archetype | Conversational Function |
|---|---|---|---|
| **Host 1 (The Anchor)** | `Kalpana` (en-IN)<br>`Shivani` (hi-IN) | Synthesizer & Storyteller | Warm, curious, sets historical context, shares analogies, and welcomes the guest into the conversation. |
| **Host 2 (The Provocateur)** | `Avinash` (en-IN & hi-IN) | Devil's Advocate & Sparring Partner | Skeptical, sharp, fast-paced, pragmatic. Questions textbook assumptions, brings real-world edge cases, and challenges Host 1. |
| **User (The Guest)** | Human Audio / Text | Guest / Arbiter | Evaluates the clash, takes a side, introduces personal intuition, or arbitrates between the two hosts. |

---

### 3.2 Turn Generation & Data Contract

A single Gemini 3.5 Flash Lite call produces a structured multi-speaker beat:

```json
{
  "dialogue": [
    {
      "speaker": "Host1",
      "voice": "Kalpana",
      "text": "When Abraham Wald analyzed the surviving bombers, every engineer wanted to armor where the bullet holes were. It feels completely rational until you realize the missing planes are the only ones that actually matter."
    },
    {
      "speaker": "Host2",
      "voice": "Avinash",
      "text": "Right, but in business, if you don't copy what surviving winners do, you have zero playbook. Ankush, how do you separate useful heuristics from pure survivorship bias?"
    }
  ],
  "directed_at_guest": true,
  "topic_insight": "The tension between statistical reality and pragmatic action."
}
```

---

### 3.3 Zero-Latency Parallel Voice Synthesis Pipeline

To prevent 2x TTS delay, both host segments synthesize concurrently via `asyncio.gather()`:

```python
# Both voice requests execute in parallel on Gnani Timbre v3.0
audio_segment_1, audio_segment_2 = await asyncio.gather(
    synthesize_speech(turn.dialogue[0].text, voice="Kalpana", language=lang),
    synthesize_speech(turn.dialogue[1].text, voice="Avinash", language=lang),
)
```

* **Latency:** Bounded by `max(Host1, Host2)` $\approx 300\text{--}450\text{ms}$.
* **Transport:** Returns a structured JSON response with base64 audio chunks or multi-part audio blobs to the frontend.

---

### 3.4 Frontend Audio Cascading & Studio UI

1. **Audio Queue Cascade:**
   * Plays Segment 1 $\rightarrow$ Host 1's avatar/badge pulses with green acoustic glow.
   * Seamlessly chains into Segment 2 $\rightarrow$ Host 2's avatar/badge pulses with green acoustic glow.
   * VoiceOrb resets to `idle`: `"WEIGH IN (HOLD SPACEBAR OR TAP)"`.
2. **Interruption Affordance:**
   * If the user presses the mic/spacebar while either host is speaking, playback instantly cuts off and enters `listening` mode.
3. **Studio Desk Header (`StudioHeader.tsx`):**
   * Live visualizer showing presence for `Kalpana` / `Shivani`, `Avinash`, and `You (Guest)`.

---

## 4. Shared Knowledge Layer: Topic Dossiers

Directory: `backend/data/dossiers/`

### Dossier Structure (`{topic_id}.md`):
1. **Title & Categorization**
2. **The Core Paradox:** The counter-intuitive truth.
3. **Historical Foundations & Evidence:** Real events, data, and foundational papers.
4. **Anchor Thesis (Host 1):** The intellectual, systemic viewpoint.
5. **Provocateur Counter-Thesis (Host 2):** The pragmatic, incentive-driven pushback.
6. **Thought Experiments:** 3 concrete scenarios for the hosts to throw at the guest.

---

## 5. Phased Implementation Roadmap

### Phase 1: In-Context Dossiers & Topic Layer `[COMPLETED ✅]`
- [x] `[Backend]` Create `backend/data/dossiers/` directory.
- [x] `[Backend]` Author pilot dossier: `survivorship-bias.md` (Abraham Wald WWII armor paradox, thought experiments).
- [x] `[Backend]` Implement `backend/services/dossier_loader.py` with fallback synthesis for dynamic topics.
- [x] `[Backend]` Update `backend/routers/topics.py` and `backend/routers/spar.py` to inject dossiers into topic payloads.
- [x] `[Backend]` Author and pass automated verification: `test_scripts/verify_phase1_dossiers.py`.

### Phase 2: Socratic Sparring Engine Refinement `[COMPLETED ✅]`
- [x] `[Backend]` Update `backend/services/socratic_engine.py`:
  - Relax question mandate (~40% reflective conclusions without a mandatory question).
  - Expand sentence limit to 3–5 when introducing analogies.
  - Wire Markdown dossier directly into Gemini static system prompt.
- [x] `[Frontend]` Soften `StageProgress.tsx` to an ambient cadence header, removing the gamified `/05` checklist dots.
- [x] `[Backend]` Author and pass automated verification: `test_scripts/verify_phase2_pacing.py`.

### Phase 3: Podcast Studio Engine `[COMPLETED ✅]`
- [x] `[Backend]` Implement `PodcastSession` state machine in `backend/services/podcast_engine.py`.
- [x] `[Backend]` Author studio cast prompts: `STUDIO_PROMPT_EN` (Kalpana + Avinash) & `STUDIO_PROMPT_HI` (Shivani + Avinash).
- [x] `[Backend]` Enforce native Gemini 3.5 Flash Lite structured JSON generation via `response_schema=PodcastTurn`.
- [x] `[Backend]` Multi-turn conversation history tracking across Host 1, Host 2, and Guest.
- [x] `[Backend]` Author and pass automated verification: `test_scripts/verify_phase3_podcast.py`.

### Phase 4: Audio Synthesis & Dual-Mode Dispatch `[COMPLETED ✅]`
- [x] `[Backend]` Migrate `backend/services/gnani_tts.py` to Timbre v3.0 REST endpoint (`Kalpana`, `Shivani`, `Avinash`).
- [x] `[Backend]` Add `asyncio.Lock()` to `synthesize_speech` to strictly respect Gnani's 1-active-request concurrency limit (resolving HTTP 429).
- [x] `[Backend]` Update `backend/routers/spar.py` with dual-mode router dispatch (`mode: "podcast" | "spar"`).
- [x] `[Backend]` Implement sequential speech synthesis returning segmented base64 audio payloads (`_synthesize_podcast_dialogue`).
- [x] `[Backend]` Author and pass automated verification: `test_scripts/verify_phase4_dispatch.py`.

### Phase 5: Authentication & Google Identity Layer `[COMPLETED ✅]`
- [x] `[Frontend]` Install `@react-oauth/google` and `jwt-decode`.
- [x] `[Frontend]` Create `frontend/src/components/providers/AuthProvider.tsx` Client Component wrapper.
- [x] `[Frontend]` Wrap `frontend/src/app/layout.tsx` with `<AuthProvider>`.
- [x] `[Frontend]` Add persistent user authentication state in Zustand (`frontend/src/lib/store.ts` synced with `localStorage`).
- [x] `[Frontend]` Embed one-click Google Sign-In into `frontend/src/components/landing/AuthModal.tsx`.
- [x] `[Frontend]` Display Google profile picture, name, and sign-out controls in `frontend/src/components/landing/Navbar.tsx`.
- [x] `[Frontend]` Create standalone reusable `GoogleAuthButton.tsx` component.
- [x] `[Frontend]` Run production build verification (`next build` — 5/5 static pages passed with 0 errors).

### Phase 6: Dedicated Studio Hub (`/studio`) `[COMPLETED ✅]`
- [x] `[Frontend]` Create `frontend/src/app/studio/page.tsx` — the dedicated dialectical lobby.
- [x] `[Frontend]` Build **User Welcome Header** displaying the user's name (*"Welcome back, Ankush"*) and Google avatar.
- [x] `[Frontend]` Build **Sticky Dialectic Setup Bar**:
  - **Modality Switcher:** 🎙️ **Podcast Studio** *(Default · 3-Way Roundtable)* vs. ⚔️ **Sparring Arena** *(1-on-1 Socratic Duel)*.
  - **Language Switcher:** `English (Kalpana/Avinash)` vs. `Hinglish (Shivani/Avinash)`.
- [x] `[Frontend]` Build **Curated Topic Grid (Daily Drops)** with category chips, opening paradox hooks, and dossier badges.
- [x] `[Frontend]` Build **"Bring Your Own Spark" Custom Topic Bar** for on-the-fly topic generation.
- [x] `[Frontend]` Connect Landing Page redirects:
  * Clicking "try demo" in `Navbar.tsx` → routes to `/studio`.
  * Completing sign-in in `AuthModal.tsx` → routes to `/studio`.
  * Hero CTA / SectionOne "Try Demo" → routes to `/studio`.
- [x] `[Backend]` Ensure `GET /topics/daily` serves all metadata required by the topic cards.

### Phase 7: Interactive Studio & Arena Workspace (`/spar/[topic]`) `[COMPLETED ✅]`
- [x] `[Frontend]` Update `frontend/src/lib/api.ts` and `frontend/src/types/spar.ts`:
  * Pass `mode: "podcast" | "spar"`, `language`, and `user_name` in `startSpar`.
  * Support `DialogueSegmentPayload` array (`speaker`, `voice`, `text`, `audio_base64`).
- [x] `[Frontend]` Build `frontend/src/components/spar/StudioHeader.tsx`:
  * Live broadcast presence bar showing Host 1, Host 2, and Guest with active soundwave pulses.
- [x] `[Frontend]` Implement **Sequential Audio Cascade Engine** in `app/spar/[topic]/page.tsx`:
  * Play Segment 1 (Host 1) $\rightarrow$ seamlessly transition to Segment 2 (Host 2) $\rightarrow$ open floor to Guest (`"WEIGH IN — HOLD SPACEBAR OR TAP"`).
- [x] `[Frontend]` Implement **Instant Live Interruption Affordance**:
  * Holding spacebar or tapping the mic instantly halts host audio playback and switches to user recording.
- [x] `[Frontend]` Upgrade `frontend/src/components/spar/TranscriptFeed.tsx`:
  * Color-coded speaker chips: `[KALPANA / SHIVANI]`, `[AVINASH]`, `[YOU]`.
  * Topic insight strips above dialectic beats.
- [x] `[Frontend]` Update `VoiceOrb.tsx` to color-shift based on active speaker (`Host1`, `Host2`, or `Guest`).
- [x] `[Frontend]` Enforce strict anti-slop guidelines: zero `rounded-full` pills, sharp architectural borders, Swiss typography.

### Phase 8: Knowledge Layer Expansion (Deep Topic Dossiers) `[COMPLETED ✅]`
- [x] `[Backend]` Author `backend/data/dossiers/hedonic-treadmill.md` (Brickman lottery/paralysis studies, baseline adaptation).
- [x] `[Backend]` Author `backend/data/dossiers/chestertons-fence.md` (G.K. Chesterton 1929 *The Thing*, second-order effects).
- [x] `[Backend]` Author `backend/data/dossiers/tragedy-of-the-commons.md` (Hardin 1968 vs. Ostrom Nobel-winning polycentric governance).
- [x] `[Backend]` Author `backend/data/dossiers/dunning-kruger.md` (Kruger & Dunning 1999 Cornell study, metacognitive incompetence).

### Phase 9: Thought Card Vault & Scribe Integration `[COMPLETED ✅]`
- [x] `[Frontend]` Redesign `frontend/src/components/spar/AtomicThoughtCard.tsx` into an archival index card.
- [x] `[Frontend]` Add 1-Click Markdown Copy button (pre-formatted for Obsidian & Notion).
- [x] `[Frontend]` Build **My Thought Cards Vault** (drawer/section on `/studio` displaying past session cards saved in `localStorage`).
- [x] `[Backend]` Ensure `backend/services/scribe.py` gracefully extracts user convictions from 3-way multi-speaker podcast transcripts.

### Phase 10: Calibration, Rehearsal & Submission Packaging `[FINAL STEP 🏁]`
- [ ] `[Backend & Frontend]` **English Track Rehearsal:**
  * Topic: *Survivorship Bias* | Mode: Podcast Studio.
  * Verify audio cascade, interruption, and thought card generation.
- [ ] `[Backend & Frontend]` **Hinglish Track Rehearsal:**
  * Topic: *Hedonic Treadmill* | Mode: Podcast Studio.
  * Verify Shivani & Avinash code-switching fluency.
- [x] `[Documentation]` Author comprehensive `README.md`:
  * Dual-modality architecture diagram.
  * Indic Voice Pipeline (Gnani Timbre v3.0 REST with concurrency lock + Prisma STT).
  * Gemini 3.5 Flash Lite Structured JSON Schema + Markdown Dossiers.
  * Setup & run instructions.
- [ ] `[Deliverable]` Record 2–3 minute video walkthrough for the Gnani internship challenge.

---

## 6. Verification Criteria & Invariants

* **Model Invariant:** Primary LLM strictly remains `gemini-3.5-flash-lite`.
* **Voice Invariant:** Timbre v3.0 (`Kalpana` & `Avinash` for `en-IN`, `Shivani` & `Avinash` for `hi-IN`).
* **Non-Destructive Invariant:** The existing sparring engine continues to function and pass tests while podcast features are added.
