<div align="center">
  <img src="https://img.shields.io/badge/JobOS-Personal%20Job%20Search%20OS-6366f1?style=for-the-badge" alt="JobOS" />
  <br /><br />
  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" />
    <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker" />
    <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css" />
  </p>
</div>

# JobOS — Personal Job Search Operating System

> Your command center for the entire job search process. Never use Excel or Notion to track jobs again.

JobOS is a production-grade, self-hosted personal dashboard that brings every aspect of job searching into one polished application — pipeline management, recruiter CRM, email templates, analytics, documents, and more.

---

## ✨ Features

### 📊 Dashboard
- Live stats: total jobs, applied, interviews, offers, response rate, offer rate
- Monthly application trend chart
- Upcoming interviews widget
- Deadlines this week
- Recent activity feed

### 🗂 Job Pipeline (Kanban)
- Drag-and-drop Kanban board with 11 stages
- Stages: Saved → Researching → Ready → Applied → Phone Screen → Technical → Final Round → Offer → Negotiation → Accepted → Rejected
- Instant PostgreSQL update on card drop
- Color-coded columns, match score, priority indicators

### 💼 Jobs Database
- Full job tracking: title, company, salary, location, remote type
- Status management with quick-update buttons
- Skills matching with visual match score bar
- Duplicate detection
- Application date tracking, deadlines, follow-up dates
- Inline edit, delete, detail slide panel

### 🏢 Companies Database
- Company cards with tech stack, remote policy, visa sponsorship
- Glassdoor rating, Levels.fyi notes
- Favorite/priority system
- Job and recruiter counts per company

### 👥 Recruiter CRM
- Track recruiter contacts with full relationship history
- Relationship status: New → Warm → Hot → Connected
- Follow-up reminder dates
- LinkedIn integration

### 📧 Email Center
- 8 email template categories: Cold Outreach, Follow-up, Thank You, Referral, Networking, Negotiation, Reconnect, Rejection Response
- Variable substitution system `{{VariableName}}`
- Email history tracking
- One-click copy to clipboard

### 📈 Analytics
- Application funnel (Applied → Interviews → Offers → Accepted)
- Monthly applications line chart
- Work type distribution pie chart
- Top required skills bar chart
- Applications by location
- Rejection reasons breakdown

### 📅 Calendar
- Month view with color-coded events
- Interview dates (indigo), Deadlines (red), Follow-ups (amber), Reminders (violet)
- Upcoming events sidebar

### 📄 Documents
- Store resumes, cover letters, portfolios, certificates
- Version tracking
- Set default document
- Track which jobs used each document

### 🔍 Global Search
- Command palette (⌘K) across jobs, companies, recruiters
- Instant fuzzy search results
- Keyboard navigation

### ⚙️ Settings
- Goal tracking with progress bars
- Data export (JSON)
- Profile management

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│         Next.js 16 App Router (Client)           │
│    React · TanStack Query · Zustand · Framer     │
└──────────────────────┬──────────────────────────┘
                       │ HTTP / REST
┌──────────────────────▼──────────────────────────┐
│              Next.js API Routes                  │
│     Auth.js · Prisma 7 · Zod · bcryptjs         │
└──────────────────────┬──────────────────────────┘
                       │ pg adapter
┌──────────────────────▼──────────────────────────┐
│              PostgreSQL 16                       │
│   20+ normalized tables · Full-text indexes      │
└─────────────────────────────────────────────────┘
```

### Docker Architecture
```
docker-compose.yml
├── postgres (port 5432, volume: postgres_data)
└── app      (port 8080, depends on postgres)
```

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
git clone https://github.com/YOUR_USERNAME/jobos.git
cd jobos

# Start everything with one command
docker compose up -d

# App is live at:
open http://localhost:8080
```

### Option 2: Local Development

**Prerequisites:** Node.js 20+, PostgreSQL 16

```bash
git clone https://github.com/YOUR_USERNAME/jobos.git
cd jobos

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev

# Open app
open http://localhost:3000
```

---

## 🐳 Docker Setup

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f app

# Stop all services
docker compose down

# Stop and remove volumes (wipes database)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build
```

The `docker-compose.yml` creates:
- **postgres** — PostgreSQL 16 with persistent volume
- **app** — Next.js app, auto-migrates on startup
- **jobos-network** — Bridge network connecting services

---

## 🔧 Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL="postgresql://jobos:jobos_secret@localhost:5432/jobos?schema=public"

# Auth (generate a secure random string for production)
NEXTAUTH_URL="http://localhost:8080"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
```

**Production:** Change `NEXTAUTH_SECRET` to a cryptographically random 32+ character string.

```bash
# Generate a secure secret
openssl rand -base64 32
```

---

## 📁 Folder Structure

```
jobos/
├── prisma/
│   ├── schema.prisma        # Full database schema
│   └── migrations/          # SQL migration files
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Register pages
│   │   ├── (dashboard)/     # All main app pages
│   │   │   ├── dashboard/
│   │   │   ├── jobs/
│   │   │   ├── pipeline/
│   │   │   ├── companies/
│   │   │   ├── recruiters/
│   │   │   ├── emails/
│   │   │   ├── analytics/
│   │   │   ├── calendar/
│   │   │   ├── documents/
│   │   │   └── settings/
│   │   └── api/             # REST API routes
│   ├── components/
│   │   ├── ui/              # Reusable UI primitives
│   │   ├── layout/          # Sidebar, Topbar, CommandPalette
│   │   ├── jobs/            # JobForm, JobDetail
│   │   ├── companies/       # CompanyForm
│   │   └── recruiters/      # RecruiterForm
│   ├── hooks/
│   │   └── use-toast.ts
│   └── lib/
│       ├── auth.ts          # Auth.js config
│       ├── prisma.ts        # Prisma client
│       └── utils.ts         # Utilities, constants
├── docker-compose.yml
├── Dockerfile
└── prisma.config.ts
```

---

## 🗄 Database Schema

**Core tables:** users, accounts, sessions

**Job tracking:** jobs, companies, interviews, activities

**Networking:** recruiters, emails, email_templates

**Organization:** documents, notes, reminders, tags, goals

**UI state:** widget_layouts

See [`prisma/schema.prisma`](prisma/schema.prisma) for the full schema with all relations.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Components | Radix UI primitives |
| Animations | Framer Motion |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Data Fetching | TanStack Query |
| Forms | React Hook Form + Zod |
| State | Zustand |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Auth | Auth.js (next-auth v5) |
| Icons | Lucide React |
| Containers | Docker + Docker Compose |

---

## 📜 Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run start        # Start production server (port 8080)
npx prisma studio    # Open Prisma database GUI
npx prisma migrate dev --name <name>  # Create new migration
```

---

## 🔐 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT sessions via Auth.js
- All API routes require authentication
- Input validation with Zod on every endpoint
- Prepared queries via Prisma (SQL injection protection)
- Environment variables for all secrets

---

## 🚢 Deployment

### Self-hosted (VPS/Server)

```bash
# Clone and build
git clone https://github.com/YOUR_USERNAME/jobos.git
cd jobos

# Update .env.docker with production values
# especially NEXTAUTH_SECRET and NEXTAUTH_URL

docker compose -f docker-compose.yml up -d
```

### Fly.io / Railway / Render

The app can be deployed to any platform that supports Docker. Set the environment variables as platform secrets.

---

## 🗺 Roadmap

- [ ] Mobile responsive improvements
- [ ] Email sending integration (SendGrid/Resend)
- [ ] Job board scraping / one-click import
- [ ] Interview prep notes with markdown
- [ ] Resume builder
- [ ] Offer comparison calculator
- [ ] Browser extension for one-click job save
- [ ] AI-powered job description analysis
- [ ] Export to PDF (resume tracker report)
- [ ] Dark/light mode toggle

---

## 📝 License

MIT — free for personal use.

---

<div align="center">
  Built with ⚡ by and for job seekers who think in systems.
</div>
