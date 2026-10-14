# Proof-of-Work Portfolio

> **Hacktoberfest 2026 — Week 2 "Side Hustle" Entry**  
> **Submission Deadline:** October 19, 2026, 11:59 AM PKT  
> **Repository:** [https://github.com/xenover09/proof-of-work-portfolio](https://github.com/xenover09/proof-of-work-portfolio)  
> **License:** MIT &bull; **Cost:** 100% Free Tier ($0/mo forever)

---

## 💡 The Idea: Why Proof-of-Work?

Generative AI and automated resume writers have caused a collapse of trust in technical hiring and freelance contracting. Anyone can prompt ChatGPT to produce a sleek portfolio claiming they:
- *"Architected high-throughput microservices handling millions of events"*
- *"Optimized database queries for 10x throughput"*
- *"Built production SaaS platforms for Fortune 500 enterprises"*

Recruiters and clients are drowning in unverified, exaggerated claims. Resumes without receipts carry zero signal.

### The Solution:
**Proof-of-Work Portfolio** is an anti-hallucination, evidence-first portfolio builder for software engineers, freelancers, and students. Every project is anchored by:
1. **The Hard Problem Statement:** Explicit technical friction, constraints, and bottlenecks — not generic bullet points.
2. **Architectural Decisions & Rejected Alternatives:** Clear rationale demonstrating why Alternative A was chosen over Alternative B (e.g., PostgreSQL vs MongoDB, REST vs gRPC). Authentic engineers articulate real trade-offs that AI cannot fabricate.
3. **Dated Artefacts (The Receipts):** Verifiable links, immutable git commit SHAs, PR diffs, early design drafts, and benchmark terminal logs with immutable timestamps.
4. **One-Tap Client Confirmation Flow:** A private, tamper-proof verification URL issued to the client or product lead. The client reviews the deliverable summary and authenticates it in five seconds with zero signup required. The project immediately displays the verified seal.

---

## 🎨 Design Philosophy: Clean Light Theme

Built strictly under restrained, high-contrast visual design principles:
- **NO gradients**, **NO neon glow**, **NO glassmorphism blur**.
- Clean, editorial, Swiss-inspired typography-first layout.
- High-contrast slate typography (`#0F172A`, `#334155`) with monospace accents for hashes and timestamps.
- Crisp 1px solid slate borders (`#E2E8F0`, `#CBD5E1`).
- Solid, high-legibility verification badges (`#15803D` on `#F0FDF4`).
- Fully responsive across mobile (360px+), tablet, and desktop viewports with touch-friendly controls.

---

## 🛠️ Zero-Cost Stack ($0/month)

Adhering strictly to a 100% free, vendor-neutral architecture:
- **Backend & API:** Node.js (v20+) + Express.js
- **Database:** SQLite with WAL mode (`better-sqlite3`) &mdash; zero operational overhead, ACID transactional guarantees, and zero vendor lock-in. Portable to any free host or persistent cloud tier.
- **Frontend:** Vanilla HTML5, responsive CSS3, and modern JavaScript. Zero bloated client bundles.
- **Hosting:** Free Web Service tier on Render / Koyeb / Railway / Docker.

---

## 🚀 Key Features Built (Day 1)

1. **Public Repository & Hacktoberfest Context:**
   - Public open-source repository with full Day 1 implementation.
2. **Landing Page (`/`):**
   - High-impact value proposition explaining the AI trust crisis.
   - Comparison matrix: Generic AI Portfolios vs. Proof-of-Work.
   - Three-step workflow breakdown (*"How It Works"*).
   - Live platform stats (Client confirmed proofs, artefacts logged, trade-offs documented).
   - Live proofs feed pulled directly from the database.
3. **Project Creator Flow (`/create`):**
   - Creator profile setup (name, username, role, GitHub link, bio).
   - Core project details with problem statement and measurable result.
   - Dynamic builder for **Architectural Decisions & Rejected Alternatives**.
   - Dynamic builder for **Dated Artefacts** (Commit SHA, PR, draft, benchmark, staging deploy).
   - Automatic generation of the client confirmation link with one-click copy.
4. **Portfolio Template View (`/p/:username`):**
   - Clean, verified developer profile with live trust score indicator.
   - Comprehensive project cards displaying problem, decision highlights, receipts count, and client confirmation seal.
   - Direct modal to copy/resend client confirmation links.
5. **Dedicated Project Proof View (`/project/:id`):**
   - Granular breakdown of the problem, complete architectural decision matrix, chronological receipts timeline, and client endorsement testimonial banner.
6. **Client Confirmation Portal (`/confirm/:token`):**
   - Tamper-proof token page for buyers/clients.
   - One-tap **"Yes, I Confirm Deliverable"** or **"No, Dispute Claim"**.
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
5. Click **Create Web Service** &mdash; your app is live on a free `.onrender.com` URL.

### Option B: Docker Container
```bash
docker build -t proof-of-work-portfolio .
docker run -p 3000:3000 proof-of-work-portfolio
```

---

## 🧪 Verification & End-to-End Test

To test the entire client-confirm flow end-to-end:
```bash
node test_e2e.js
```
The automated suite will:
1. Initialize the SQLite database.
2. Publish an authentic project proof with decisions and dated artefacts.
3. Generate a private client confirmation token URL.
4. Simulate the client tapping **"Yes, I Confirm Deliverable"** with feedback.
5. Verify that the portfolio status turns green and metrics are updated.

---

## 📅 Hacktoberfest Week 2 Roadmap
- [x] **Day 1:** Public Repo + Landing Page + Portfolio Template + Client-Confirm Flow + Zero-Cost Deployment Blueprint.
- [ ] **Day 2:** Cryptographic signature hashing for commit SHAs + GitHub PR auto-fetcher.
- [ ] **Day 3:** Public API endpoints for recruiters + embeddable markdown badge for GitHub READMEs.
- [ ] **Day 4:** Client dispute resolution & email notifications via free SMTP/Resend tier.
- [ ] **Day 5:** Final Polish & Week 2 Submission Showcase.
