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
**Proof-of-Work Portfolio** is an anti-hallucination, evidence-first portfolio builder for software engineers, freelancers, and students. Built on the researched structure used by senior and staff engineers at top technology companies:

#### 1. The Researched Portfolio Structure:
`Hero → About → Experience → 2-4 Finished Projects (Best First) → Open Source → Writing & Talks → Honest Skills → Identifiable Recommendations → Contact + CV`

#### 2. The Senior Case Study Standard:
Every project is documented as an auditable technical case study:
- **Specific Problem & Constraints:** Explicit operational friction, latency, and scale bottlenecks &mdash; never generic tutorial bullet points.
- **Architectural Decisions & Rejected Alternatives:** Clear technical trade-offs documenting what was evaluated and **why alternatives were rejected**.
- **Measurable Result & Defensible Number:** A concrete, auditable metric (e.g. `4,800 req/s @ p99 38ms`) backed by benchmark logs. If confidential under NDA, mark "Confidential" &mdash; never invent percentages.
- **Micro-Attribution:** Explicit demarcation of what you personally engineered versus team or template code.
- **AI-Assistance Disclosure:** Radical honesty on where AI helped (boilerplate, mock tests) vs what you engineered and who made architectural decisions.
- **Verifiable Code Links:** Direct links to Live Demo, Git Repository, and Technical README.
- **Dated Technical Receipts:** Git commit hashes, PR diffs, staging URLs, and benchmark runs.

#### 3. Ethical NDA Handling:
If client work is confidential: anonymize the client to industry and scale (e.g., *"Tier-1 Payment Gateway &bull; ~10M MAU"*), keep the technical challenge and individual contribution 100% specific, and mark metrics as *"Confidential"*.

#### 4. Radical Honesty Guarantees:
- **Zero Fake Personas:** No fabricated names, fake organizations, or simulated testimonials.
- **Identifiable Recommendations Only:** Recommendations appear only when a real client authenticates the deliverable via private link.
- **Real Platform Stats:** Stats display only verified counts (0 if none confirmed yet &mdash; never simulated counts).
- **Clear Sample Badging:** Any demonstration entry carries a prominent `SAMPLE DATA — NOT A REAL CONFIRMATION` badge and is excluded from stats.

#### 5. AI Claim-Evidence Corroboration Engine:
Local open-weight semantic vector analysis that compares user claims and architectural trade-offs against attached commit SHAs, PR diffs, and benchmark logs, outputting an auditable verdict: `Supported`, `Unclear`, or `Unsupported`.

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
   - Link-based token page for buyers/clients.
   - One-tap **"Yes, I Confirm Deliverable"** or **"No, Dispute Claim"**.
   - Optional client name/organization & testimonial quote input.
   - Instant state transition with live portfolio update.
7. **Verified CV Builder & Job-Criteria Audit (`/cv`):**
   - **4 ATS-Safe Single-Column Templates:** Classic Professional (Harvard-style), Modern (Single-column typography & hierarchy, skills top), Skills-First/Functional (Career-switchers with competency clusters top), and Minimal Single-Page (Compact ATS, standard headings). Zero two-column layouts, sidebars, tables, or decorative icons.
   - **Verified-Only Rule:** CV exports exclusively contain entries backed by dated commit receipts, benchmark logs, or authenticated client confirmations. Unverified claims display the warning: *"Ye entry verified nahi hai — CV mein add nahi hogi jab tak saboot na ho."* and are excluded from output until verifiable proof is linked.
   - **Job-Criteria CV Audit:** Paste any target Job Description to run an automated criteria-wise gap analysis (Met requirements with proof citations vs Missing evidence gaps). Strictly zero arbitrary "% match" scores and zero exaggerated ranking claims.
   - **Print & PDF Export:** Native print styling (`@media print`) for clean, single-column ATS-compliant A4/Letter PDF generation via `window.print()`.

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
