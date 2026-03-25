'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Zap, ArrowRight, Check, Star, Shield, BarChart3, Users, Brain,
  Globe, Clock, FileText, MessageSquare, Workflow, ChevronDown,
  ChevronUp, Sparkles, TrendingUp, Heart, ShieldCheck, Briefcase,
  Receipt, UserPlus, Menu, X, Play
} from 'lucide-react';

/* ---------- Pricing Data ---------- */
const PLANS = [
  {
    name: 'Starter',
    desc: 'For small teams getting started with AI-powered revenue operations.',
    monthlyPrice: 29,
    yearlyPrice: 24,
    features: [
      'Up to 5 users',
      '500 organizations',
      'Revenue Engine (basic)',
      'CRM Hub',
      'Email support',
      '1 industry pack',
      '1,000 AI credits/month',
      '5 GB storage',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Growth',
    desc: 'For growing businesses that need full AI automation & advanced analytics.',
    monthlyPrice: 79,
    yearlyPrice: 66,
    features: [
      'Up to 25 users',
      'Unlimited organizations',
      'Revenue Engine (full)',
      'CRM Hub + Workflows',
      'AI Document Intelligence',
      '3 industry packs',
      '10,000 AI credits/month',
      '50 GB storage',
      'Priority support',
      'Webhooks & API access',
      'Advanced reports',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    desc: 'For large organizations needing full customization, compliance & SLA.',
    monthlyPrice: 199,
    yearlyPrice: 166,
    features: [
      'Unlimited users',
      'Unlimited everything',
      'All industry packs',
      'Unlimited AI credits',
      'Unlimited storage',
      'SSO / SAML',
      'Custom integrations',
      'Dedicated success manager',
      '99.9% SLA',
      'Custom training',
      'On-premise option',
      'Audit & compliance logs',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const FEATURES = [
  { icon: TrendingUp, title: 'Revenue Engine', desc: 'AI-powered follow-ups, renewal tracking, at-risk detection and contract management in one place.' },
  { icon: Users, title: 'CRM Hub', desc: 'Organizations, contacts, and leads with pipeline management. All data connected to revenue intelligence.' },
  { icon: Brain, title: 'AI Assistant', desc: 'Generate follow-up emails, renewal reminders, and risk explanations with GPT-4o & Claude AI.' },
  { icon: FileText, title: 'Document Intelligence', desc: 'Upload contracts, proposals, and invoices. AI auto-extracts key data points and deadlines.' },
  { icon: Workflow, title: 'Workflow Automation', desc: 'Build custom workflows triggered by events, schedules, or webhooks. Automate repetitive tasks.' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Real-time dashboards with KPIs, revenue charts, conversion rates, and activity feeds.' },
  { icon: MessageSquare, title: 'Communication Hub', desc: 'Track all emails, calls, meetings, and messages in one timeline per organization.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Multi-tenant isolation, role-based access, audit logs, and encrypted data at rest.' },
  { icon: Globe, title: 'Multi-Country & Multilingual', desc: 'Support for 10+ languages, currencies, timezones, and country-specific configurations.' },
];

const INDUSTRY_PACKS = [
  { icon: UserPlus, name: 'RecruitFlow', desc: 'Staffing & recruitment workflows — jobs, candidates, applications, interviews.', color: 'text-blue-400' },
  { icon: Heart, name: 'MediFlow', desc: 'Healthcare practice management — patients, appointments, practitioner scheduling.', color: 'text-rose-400' },
  { icon: ShieldCheck, name: 'InsureFlow', desc: 'Insurance brokerage tools — policies, claims, premium tracking, renewal alerts.', color: 'text-indigo-400' },
  { icon: Briefcase, name: 'AgencyFlow', desc: 'Creative & marketing agency ops — projects, proposals, budgets, milestones.', color: 'text-violet-400' },
  { icon: Receipt, name: 'FinanceFlow', desc: 'Financial services invoicing — service invoices, payments, outstanding tracking.', color: 'text-emerald-400' },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'VP Revenue, TechScale Inc.', text: 'SRP AI OS reduced our follow-up response time by 73%. The AI-generated emails are indistinguishable from human-written ones.', stars: 5 },
  { name: 'Marcus Rivera', role: 'Managing Director, Rivera Insurance', text: 'InsureFlow pack saved us 20 hours per week on policy renewals. The risk scoring is incredibly accurate.', stars: 5 },
  { name: 'Dr. Amara Okafor', role: 'Clinic Director, Okafor Health', text: 'MediFlow transformed our appointment management. Patient follow-ups now happen automatically.', stars: 5 },
  { name: 'James Whitfield', role: 'CEO, Whitfield Staffing', text: 'RecruitFlow with AI changed our entire placement process. Revenue per recruiter is up 40%.', stars: 5 },
];

const FAQS = [
  { q: 'How long is the free trial?', a: '14 days with full access to all features. No credit card required.' },
  { q: 'Can I change plans later?', a: 'Yes, upgrade or downgrade anytime. Changes take effect immediately with prorated billing.' },
  { q: 'Do you offer custom deployment?', a: 'Enterprise plans include on-premise deployment, Docker/Kubernetes support, and custom CI/CD pipelines.' },
  { q: 'What AI models are used?', a: 'We use OpenAI GPT-4o-mini and Anthropic Claude 3.5 Haiku. You can choose your preferred provider.' },
  { q: 'Is my data secure?', a: 'Yes. All data is encrypted at rest and in transit. Multi-tenant isolation ensures complete data separation. SOC 2 compliant.' },
  { q: 'How does multi-tenancy work?', a: 'Each workspace is completely isolated with its own data, settings, and user roles. No data leaks between tenants.' },
];

const LOGOS = [
  'TechScale', 'Rivera Insurance', 'Okafor Health', 'Whitfield Staffing', 'Global Recruit', 'FinServe Pro'
];

export default function MarketingPage() {
  const [annual, setAnnual] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ====== NAVBAR ====== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">SRP AI OS</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#packs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Industry Packs</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2">
                Sign In
              </Link>
              <Link href="/login" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-3">
            <a href="#features" className="block text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#packs" className="block text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Industry Packs</a>
            <a href="#pricing" className="block text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" className="block text-sm py-2" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
            <a href="#faq" className="block text-sm py-2" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <div className="pt-2 space-y-2">
              <Link href="/login" className="block text-center rounded-lg border px-4 py-2 text-sm font-medium">Sign In</Link>
              <Link href="/login" className="block text-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Start Free Trial</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ====== HERO ====== */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full bg-chart-purple/10 blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card/50 px-4 py-1.5 text-xs font-medium mb-6 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>AI-Powered Revenue Operations</span>
            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">NEW</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            The AI Operating System for{' '}
            <span className="bg-gradient-to-r from-primary via-chart-blue to-chart-purple bg-clip-text text-transparent">
              Service Revenue
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            CRM, revenue intelligence, workflow automation, and industry-specific packs — all powered by AI. 
            Built for staffing, healthcare, insurance, agencies, and financial services.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-xl hover:opacity-90 transition-all hover:shadow-2xl"
            >
              Start Free 14-Day Trial <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border bg-card/50 px-8 py-3.5 text-base font-medium hover:bg-card transition-colors backdrop-blur-sm"
            >
              <Play className="h-4 w-4" /> Watch Demo
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-400" /> No credit card required</span>
            <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-emerald-400" /> SOC 2 Compliant</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-emerald-400" /> Setup in 5 minutes</span>
            <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-emerald-400" /> 10+ countries supported</span>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="rounded-2xl border-2 border-border/50 bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 text-center text-xs text-muted-foreground">app.srpai.os — Dashboard</div>
            </div>
            <div className="p-6 sm:p-8">
              {/* Fake dashboard content */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Revenue', value: '$2.4M', change: '+12%', color: 'text-emerald-400' },
                  { label: 'At-Risk Clients', value: '7', change: '-23%', color: 'text-red-400' },
                  { label: 'Follow-ups Due', value: '24', change: '', color: 'text-amber-400' },
                  { label: 'Renewal Rate', value: '94%', change: '+6%', color: 'text-primary' },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border bg-background/50 p-4">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    {kpi.change && <p className="text-[10px] text-emerald-400">{kpi.change} vs last month</p>}
                  </div>
                ))}
              </div>
              {/* Fake chart bars */}
              <div className="rounded-xl border bg-background/50 p-4">
                <p className="text-xs font-semibold mb-3">Revenue Trend</p>
                <div className="flex items-end gap-1 h-24">
                  {[40, 55, 45, 65, 50, 70, 60, 80, 75, 90, 85, 95].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-primary/60 hover:bg-primary transition-colors" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Jan</span><span>Jun</span><span>Dec</span>
                </div>
              </div>
            </div>
          </div>
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
        </div>
      </section>

      {/* ====== LOGOS ====== */}
      <section className="py-12 border-y bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">Trusted by leading service businesses</p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {LOGOS.map((name) => (
              <span key={name} className="text-sm font-semibold text-muted-foreground/50">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Everything you need to grow revenue</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">One platform to manage clients, automate follow-ups, track renewals, and leverage AI — across every industry vertical.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="group rounded-2xl border bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== INDUSTRY PACKS ====== */}
      <section id="packs" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Industry Packs</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Built for your industry</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Vertical-specific modules that plug right into the platform. Activate what you need, skip what you don&apos;t.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INDUSTRY_PACKS.map((pack) => (
              <div key={pack.name} className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-all">
                <pack.icon className={`h-8 w-8 ${pack.color} mb-4`} />
                <h3 className="font-semibold text-lg mb-2">{pack.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{pack.desc}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed bg-card/50 p-6 flex flex-col items-center justify-center text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <h3 className="font-semibold mb-1">More Coming Soon</h3>
              <p className="text-xs text-muted-foreground">Real estate, legal, logistics, education…</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== PRICING ====== */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">Start free, scale as you grow. All plans include a 14-day free trial.</p>

            {/* Annual / Monthly toggle */}
            <div className="inline-flex items-center gap-3 rounded-full border bg-card p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Annual <span className="text-xs opacity-75 ml-1">Save 17%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 flex flex-col relative ${plan.popular
                  ? 'border-primary shadow-xl shadow-primary/5 ring-1 ring-primary/20'
                  : 'bg-card hover:shadow-lg'
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                      <Star className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.desc}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">
                      ${annual ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground text-sm mb-1">/user/month</span>
                  </div>
                  {annual && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed annually (${annual ? plan.yearlyPrice * 12 : plan.monthlyPrice * 12}/user/year)
                    </p>
                  )}
                </div>

                <Link
                  href="/login"
                  className={`rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors mb-6 ${plan.popular
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'border bg-card hover:bg-muted'
                  }`}
                >
                  {plan.cta}
                </Link>

                <div className="space-y-3 flex-1">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            All prices in USD. Enterprise pricing includes custom volume discounts. 
            <a href="#faq" className="text-primary ml-1 hover:underline">See FAQ</a>
          </p>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Loved by revenue teams</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl border bg-card p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FAQ ====== */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Frequently asked questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full p-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  {faq.q}
                  {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to transform your revenue operations?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of service businesses using AI to automate follow-ups, predict churn, and grow revenue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-xl hover:opacity-90 transition-all"
            >
              Start Free Trial <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-xl border bg-card px-8 py-3.5 text-base font-medium hover:bg-muted transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">SRP AI OS</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered revenue operations platform for multi-industry service businesses.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#packs" className="hover:text-foreground transition-colors">Industry Packs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Customers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} SRP AI OS. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Built with Next.js, Tailwind CSS & AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
