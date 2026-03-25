# SRP AI OS

**Multi-Tenant AI Revenue, CRM & Workflow SaaS Platform**

Built with Next.js 14, TypeScript, Tailwind CSS, Prisma, PostgreSQL 16, Redis 7, OpenAI & Anthropic AI.

> **Live**: [https://automation.yourdomain.com](https://automation.yourdomain.com) (deploy target: 5.223.67.236)  
> **GitHub**: [https://github.com/shashankpasikanti91-blip/Automation-OS-rev-and-followups-](https://github.com/shashankpasikanti91-blip/Automation-OS-rev-and-followups-)

---

## Quick Start

### 1. Clone & Configure

```bash
git clone https://github.com/shashankpasikanti91-blip/Automation-OS-rev-and-followups-.git
cd Automation-OS-rev-and-followups-
cp .env.example .env
```

Edit `.env` and fill in required secrets:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (auto-set for Docker) |
| `NEXTAUTH_SECRET` | Random 32+ char secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` |
| `OPENAI_API_KEY` | OpenAI API key (for AI features) |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional fallback) |
| `REDIS_URL` | Redis connection string (auto-set for Docker) |

### 2. Start Dev Infrastructure (Docker)

```bash
docker-compose -f docker-compose.dev.yml up -d
```

This starts PostgreSQL 16 and Redis 7 locally. The Next.js app runs outside Docker in dev mode.

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

```bash
# Run all migrations
npm run db:migrate

# Seed with demo data (creates admin user + sample tenant)
npm run db:seed
```

### 5. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@srpaios.demo` | `Admin@1234` |
| Manager | `manager@srpaios.demo` | `Manager@1234` |

> **Change these immediately in production.**

---

## Production Deployment

```bash
# Build and start all services (app + postgres + redis) in Docker
docker-compose up -d --build
```

The production compose file runs migrations automatically on startup.

---

## Architecture Overview

```
src/
├── app/
│   ├── (app)/              # Authenticated app routes
│   │   ├── dashboard/      # Main dashboard
│   │   ├── revenue/        # Revenue Engine (follow-ups, renewals, at-risk, contracts)
│   │   ├── crm/            # CRM Hub (organizations, contacts, leads)
│   │   ├── documents/      # AI Document Intelligence
│   │   ├── communications/ # Communication Hub
│   │   ├── workflows/      # Workflow Automation
│   │   ├── reports/        # Analytics & Reports
│   │   ├── settings/       # Tenant Settings
│   │   ├── billing/        # Billing & Plans
│   │   ├── admin/          # Admin Console
│   │   └── packs/          # Industry Packs
│   │       ├── recruit/    # RecruitFlow
│   │       ├── medi/       # MediFlow
│   │       ├── insure/     # InsureFlow
│   │       ├── agency/     # AgencyFlow
│   │       └── finance/    # FinanceFlow
│   └── api/                # API routes (Next.js Route Handlers)
├── components/             # React components (mirrors app structure)
├── lib/
│   ├── ai.ts               # OpenAI + Anthropic abstraction
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Prisma client singleton
│   └── utils.ts            # Shared utilities
└── hooks/
    ├── use-debounce.ts
    └── use-toast.ts
prisma/
├── schema.prisma           # Full database schema (60+ models)
└── seed.ts                 # Demo data seeder
```

---

## Industry Packs

Each industry pack is a focused module for vertical-specific workflows:

| Pack | Use Case | Key Models |
|---|---|---|
| **RecruitFlow** | Staffing & recruitment | Jobs, Applications, Candidates |
| **MediFlow** | Healthcare practices | Patients, Appointments, Providers |
| **InsureFlow** | Insurance brokers | Policies, Claims, Renewals |
| **AgencyFlow** | Creative & marketing agencies | Projects, Proposals, Timesheets |
| **FinanceFlow** | Financial services | Service Invoices, Payments |

---

## AI Features

All AI features use the abstraction in `src/lib/ai.ts`. The default provider is OpenAI (`gpt-4o-mini`). Set `AI_PROVIDER=anthropic` in `.env` to use Claude.

| Feature | Endpoint | Description |
|---|---|---|
| Generate follow-up message | `POST /api/ai/generate` | Drafts follow-up, renewal, or risk emails |
| Document extraction | Background job | Extracts key data from uploaded PDFs |

---

## Key npm Scripts

```bash
npm run dev          # Start Next.js development server
npm run build        # Production build
npm run start        # Start production server
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:reset     # Reset DB and re-seed (destructive!)
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checks
```

---

## Environment Variables Reference

```env
# Database
DATABASE_URL="postgresql://srp:srp_pass@localhost:5432/srp_ai_os"

# Auth
NEXTAUTH_SECRET="your-super-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# AI
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
AI_PROVIDER="openai"   # or "anthropic"

# Redis
REDIS_URL="redis://localhost:6379"

# File Storage
UPLOAD_DIR="./uploads"
MAX_UPLOAD_SIZE_MB="10"
```

---

## Multi-Tenancy

Every database record is scoped to a `tenantId`. The middleware at `src/middleware.ts` enforces authentication on all `(app)` routes. All API routes re-validate `tenantId` from the session before any database query.

---

## Marketing & Pricing Page

The root URL (`/`) displays a full marketing landing page for unauthenticated visitors with:

- **Hero section** with animated dashboard mockup
- **Features grid** (9 platform capabilities)
- **Industry Packs showcase** (Recruit, Medi, Insure, Agency, Finance)
- **Pricing section** with 3 tiers (Starter $29, Growth $79, Enterprise $199 per user/mo)
- **Annual/monthly toggle** with 17% annual discount
- **Testimonials**, **FAQ accordion**, and **CTA** sections
- **Responsive mobile menu** and dark mode support

Authenticated users are redirected to `/dashboard` automatically.

### Pricing Tiers

| Plan | Monthly | Annual | Users | AI Credits |
|---|---|---|---|---|
| **Starter** | $29/user/mo | $24/user/mo | Up to 5 | 1,000/mo |
| **Growth** | $79/user/mo | $66/user/mo | Up to 25 | 10,000/mo |
| **Enterprise** | $199/user/mo | $166/user/mo | Unlimited | Unlimited |

---

## Server Deployment (Docker)

### Deploy to production server:

```bash
# On production server
git clone https://github.com/shashankpasikanti91-blip/Automation-OS-rev-and-followups-.git
cd Automation-OS-rev-and-followups-

# Configure environment
cp .env.example .env
# Edit .env with production values (DATABASE_URL, NEXTAUTH_SECRET, etc.)

# Build and start (uses existing PostgreSQL if available)
docker compose up -d --build
```

### If using external PostgreSQL (existing on server):

Set `DATABASE_URL` to your existing PostgreSQL instance and only run the app container. The `docker-compose.yml` can be customized to skip the postgres service.

---

## License

Proprietary — SRP AI OS. All rights reserved.
