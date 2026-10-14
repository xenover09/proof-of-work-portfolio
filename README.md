# Proof-of-Work Portfolio

> **Hacktoberfest 2026 — Week 2 "Side Hustle" Entry**  
> **Submission Deadline:** October 19, 2026, 11:59 AM PKT  
> **Repository:** [https://github.com/xenover09/proof-of-work-portfolio](https://github.com/xenover09/proof-of-work-portfolio)  
> **License:** MIT • **Cost:** 100% Free Tier ($0/mo forever)

---

## 💡 The Idea: Why Proof-of-Work?

AI code generators and resume builders have caused a complete collapse of trust in tech hiring and freelancing. Anyone can prompt ChatGPT to generate a slick-looking CV claiming they:
- *"Architected high-throughput microservices"*
- *"Optimized database pipelines by 400%"*
- *"Built end-to-end full stack SaaS applications for Fortune 500 clients"*

Clients and recruiters are drowning in fake, exaggerated portfolios with zero evidence. Unverified claims have zero signal.

### The Solution:
**Proof-of-Work Portfolio** is an anti-hallucination, evidence-first portfolio platform for freelancers, students, and engineers. Every claim must be backed by:
1. **The Hard Problem Statement:** Real constraints, friction, and failures solved — not generic bullet points.
2. **Decisions & Rejected Alternatives:** What trade-offs were made and why alternatives (e.g. MongoDB vs PostgreSQL, REST vs gRPC) were rejected. AI cannot hallucinate authentic context-specific architectural trade-offs.
3. **Dated Artefacts (The Receipts):** Verifiable links, immutable git commit SHAs, PR diffs, early design drafts, and benchmark logs with timestamp stamps.
4. **1-Tap Client Confirmation Flow (Tasdeeq):** A private, un-falsifiable token link sent to the real client or buyer. The client reviews the deliverable summary and taps **"Yes, I Confirm Deliverable"** in 5 seconds with zero signup. The portfolio immediately gains the green verified seal.

---

## 🎨 Design Philosophy: Saaf Light Theme

Per strict design constraints:
- **NO gradients**, **NO neon glow**, **NO glassmorphism blur**.
- High-contrast, clean editorial / Swiss design aesthetic:
  - High-legibility typography with monospace stamps for commit hashes and dates.
  - Crisp 1px solid slate borders (`#E2E8F0`, `#CBD5E1`).
  - Solid, clear verification badges (`#166534` on `#F0FDF4`).
  - Lightning-fast page loads with zero external bloated CSS frameworks.

---

## 🛠️ Zero-Cost Stack ($0/month)

In accordance with the prompt's `DO NOT use paid APIs/hosting`:
- **Backend & Server:** Node.js (v20+) + Express.js
- **Database:** SQLite with WAL mode (`better-sqlite3`) — zero operational cost, ACID transactions, and zero vendor lock-in. Portable to any free host or free DB tier (Render persistent disk, Turso free tier).
- **Frontend:** Vanilla HTML5, semantic CSS, and JavaScript. Zero client framework bundle overhead.
- **Hosting:** Free Web Service tier on Render / Koyeb / Railway / Docker.

---

## 🚀 Key Features Built (Day 1)

1. **Public Repository & Hacktoberfest Context:**
   - Public open-source repository with full Day 1 implementation.
2. **Landing Page (`/`):**
   - High-impact value proposition explaining the AI trust crisis.
   - Contrast matrix: AI/Traditional Portfolios vs. Proof-of-Work.
   - 3-Step workflow explanation (*"Kaise Kaam Karta Hai"*).
   - Live platform stats (Client confirmed proofs, artefacts logged, trade-offs documented).
   - Live proofs feed pulled directly from database.
3. **Creator Flow / "Apna Portfolio Banao" (`/create`):**
   - Profile setup (name, username, role, GitHub link, bio).
   - Core project details with problem & measurable result.
   - Dynamic builder for **Decisions & Rejected Alternatives**.
   - Dynamic builder for **Dated Artefacts** (Commit SHA, PR, draft, benchmark, staging deploy).
   - Automatic generation of the unique client confirmation link.
4. **Portfolio Template View (`/p/:username`):**
   - Clean, verified developer profile with live trust score indicator.
   - Comprehensive project cards displaying problem, decision highlights, receipts count, and client confirmation seal.
   - Direct modal to copy/resend client confirmation links.
5. **Dedicated Project Proof View (`/project/:id`):**
   - Granular breakdown of the problem, complete architectural decision matrix, chronological receipts timeline, and client endorsement testimonial banner.
6. **Client Confirmation Flow (`/confirm/:token`):**
   - Tamper-proof token page for buyers/clients.
   - 1-tap **"Yes, I Confirm Deliverable"** or **"No, Dispute Claim"**.
   - Optional client name/organization & testimonial quote input.
   - Instant state transition with live portfolio update.

---

## 💻 Local Quickstart

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/xenover09/proof-of-work-portfolio.git
cd proof-of-work-portfolio
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the server
```bash
npm start
```
The application will be live at `http://localhost:3000`.

---

## 🌐 Free Deployment Guide

### Option A: Render (1-Click Free Web Service)
1. Fork or push to your GitHub account: `https://github.com/xenover09/proof-of-work-portfolio`
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New + > Web Service**.
3. Select this repository.
4. Render automatically detects `render.yaml`:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`
5. Click **Create Web Service** — your app is live on a free `.onrender.com` URL!

### Option B: Docker Container
```bash
docker build -t proof-of-work-portfolio .
docker run -p 3000:3000 proof-of-work-portfolio
```

---

## 🧪 Verification & End-to-End Test

To test the entire client-confirm flow end-to-end:
1. Navigate to `http://localhost:3000/create`
2. Fill out a real project entry with at least one decision, rejected alternative, and dated artefact.
3. Check "Generate unique 1-tap client confirmation link immediately" and submit.
4. Copy the confirmation link (e.g. `http://localhost:3000/confirm/<token>`).
5. Open the link, enter client name/feedback, and tap **"Yes, I Confirm Deliverable"**.
6. Visit the portfolio page at `http://localhost:3000/p/<username>` — notice the green **"✓ Confirmed by Client"** badge and client testimonial!

---

## 📅 Hacktoberfest Week 2 Roadmap
- [x] **Day 1:** Public Repo + Landing Page + Portfolio Template + Client-Confirm Flow + Zero-Cost Deployment Blueprint.
- [ ] **Day 2:** Cryptographic signature hashing for commit SHAs + GitHub PR auto-fetcher.
- [ ] **Day 3:** Public API endpoints for recruiters + embeddable markdown badge for GitHub READMEs.
- [ ] **Day 4:** Client dispute resolution & email notifications via free SMTP/Resend tier.
- [ ] **Day 5:** Final Polish & Week 2 Submission Showcase.
