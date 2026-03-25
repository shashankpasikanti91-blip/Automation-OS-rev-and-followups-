import { PrismaClient, PlanTier } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SRP AI OS...');

  // ─── Seed Countries ───
  const countries = [
    { code: 'US', name: 'United States', dialCode: '+1', currency: 'USD', timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY', numberFormat: '1,000.00' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', currency: 'GBP', timezone: 'Europe/London', dateFormat: 'DD/MM/YYYY', numberFormat: '1,000.00' },
    { code: 'IN', name: 'India', dialCode: '+91', currency: 'INR', timezone: 'Asia/Kolkata', dateFormat: 'DD/MM/YYYY', numberFormat: '1,00,000.00' },
    { code: 'MY', name: 'Malaysia', dialCode: '+60', currency: 'MYR', timezone: 'Asia/Kuala_Lumpur', dateFormat: 'DD/MM/YYYY', numberFormat: '1,000.00' },
    { code: 'SG', name: 'Singapore', dialCode: '+65', currency: 'SGD', timezone: 'Asia/Singapore', dateFormat: 'DD/MM/YYYY', numberFormat: '1,000.00' },
    { code: 'PH', name: 'Philippines', dialCode: '+63', currency: 'PHP', timezone: 'Asia/Manila', dateFormat: 'MM/DD/YYYY', numberFormat: '1,000.00' },
    { code: 'ID', name: 'Indonesia', dialCode: '+62', currency: 'IDR', timezone: 'Asia/Jakarta', dateFormat: 'DD/MM/YYYY', numberFormat: '1.000,00' },
    { code: 'AE', name: 'UAE', dialCode: '+971', currency: 'AED', timezone: 'Asia/Dubai', dateFormat: 'DD/MM/YYYY', numberFormat: '1,000.00' },
    { code: 'CA', name: 'Canada', dialCode: '+1', currency: 'CAD', timezone: 'America/Toronto', dateFormat: 'YYYY-MM-DD', numberFormat: '1,000.00' },
    { code: 'AU', name: 'Australia', dialCode: '+61', currency: 'AUD', timezone: 'Australia/Sydney', dateFormat: 'DD/MM/YYYY', numberFormat: '1,000.00' },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64', currency: 'NZD', timezone: 'Pacific/Auckland', dateFormat: 'DD/MM/YYYY', numberFormat: '1,000.00' },
    { code: 'RU', name: 'Russia', dialCode: '+7', currency: 'RUB', timezone: 'Europe/Moscow', dateFormat: 'DD.MM.YYYY', numberFormat: '1 000,00' },
  ];

  for (const c of countries) {
    await prisma.country.upsert({ where: { code: c.code }, update: c, create: c });
  }

  // ─── Seed Languages ───
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', rtl: false },
    { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文', rtl: false },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false },
    { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false },
    { code: 'tl', name: 'Filipino', nativeName: 'Filipino', rtl: false },
  ];

  for (const l of languages) {
    await prisma.language.upsert({ where: { code: l.code }, update: l, create: l });
  }

  // ─── Seed Plans ───
  const plans = [
    {
      name: 'Free',
      tier: PlanTier.FREE,
      monthlyPrice: 0,
      annualPrice: 0,
      maxUsers: 2,
      maxLeads: 100,
      maxStorage: 500,
      features: ['crm', 'basic_followups', 'documents_5'],
    },
    {
      name: 'Starter',
      tier: PlanTier.STARTER,
      monthlyPrice: 29,
      annualPrice: 290,
      maxUsers: 5,
      maxLeads: 1000,
      maxStorage: 5000,
      features: ['crm', 'revenue_engine', 'documents_ai', 'communications', 'workflows_basic', '1_industry_pack'],
    },
    {
      name: 'Growth',
      tier: PlanTier.GROWTH,
      monthlyPrice: 79,
      annualPrice: 790,
      maxUsers: 20,
      maxLeads: 10000,
      maxStorage: 25000,
      features: ['crm', 'revenue_engine', 'documents_ai', 'communications', 'workflows_advanced', 'all_industry_packs', 'ai_composer', 'reports_advanced'],
    },
    {
      name: 'Enterprise',
      tier: PlanTier.ENTERPRISE,
      monthlyPrice: 199,
      annualPrice: 1990,
      maxUsers: null,
      maxLeads: null,
      maxStorage: null,
      features: ['all'],
    },
  ];

  const createdPlans: Record<string, string> = {};
  for (const p of plans) {
    const plan = await prisma.plan.upsert({
      where: { id: p.name.toLowerCase() },
      update: { ...p, features: p.features },
      create: { id: p.name.toLowerCase(), ...p, features: p.features },
    });
    createdPlans[p.name] = plan.id;
  }

  // ─── Demo Tenant ───
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'SRP AI OS Demo',
      slug: 'demo',
      status: 'TRIAL',
      settings: {
        create: {
          country: 'SG',
          timezone: 'Asia/Singapore',
          currency: 'SGD',
          currencySymbol: '$',
          defaultLanguage: 'en',
          dateFormat: 'DD/MM/YYYY',
          industry: 'generic',
        },
      },
      modules: {
        create: [
          { moduleKey: 'crm', enabled: true },
          { moduleKey: 'revenue_engine', enabled: true },
          { moduleKey: 'documents_ai', enabled: true },
          { moduleKey: 'communications', enabled: true },
          { moduleKey: 'workflows', enabled: true },
          { moduleKey: 'reports', enabled: true },
          { moduleKey: 'recruitflow', enabled: true },
          { moduleKey: 'insureflow', enabled: true },
          { moduleKey: 'agencyflow', enabled: true },
        ],
      },
    },
  });

  // ─── Demo subscription ───
  await prisma.subscription.upsert({
    where: { id: 'demo-sub' },
    update: {},
    create: {
      id: 'demo-sub',
      tenantId: tenant.id,
      planId: 'growth',
      status: 'trialing',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // ─── System Roles ───
  const roles = [
    { name: 'Super Admin', permissions: ['*'], isSystem: true },
    { name: 'Admin', permissions: ['tenant:manage', 'users:manage', 'crm:full', 'revenue:full', 'reports:view'], isSystem: true },
    { name: 'Manager', permissions: ['crm:full', 'revenue:full', 'reports:view', 'tasks:manage'], isSystem: true },
    { name: 'Sales', permissions: ['crm:view', 'crm:create', 'revenue:view', 'tasks:view'], isSystem: true },
    { name: 'Viewer', permissions: ['crm:view', 'revenue:view', 'reports:view'], isSystem: true },
  ];

  const createdRoles: Record<string, string> = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: r.name } },
      update: {},
      create: { tenantId: tenant.id, ...r, permissions: r.permissions },
    });
    createdRoles[r.name] = role.id;
  }

  // ─── Demo Admin User ───
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@srpaios.demo' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@srpaios.demo',
      passwordHash,
      name: 'Demo Admin',
      status: 'ACTIVE',
      emailVerified: true,
      userRoles: {
        create: [{ roleId: createdRoles['Admin'] }],
      },
    },
  });

  // ─── Default Pipeline ───
  const pipeline = await prisma.pipeline.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Sales Pipeline' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Sales Pipeline',
      isDefault: true,
      stages: {
        create: [
          { name: 'New Lead', order: 1, color: '#06b6d4' },
          { name: 'Contacted', order: 2, color: '#3b82f6' },
          { name: 'Qualified', order: 3, color: '#8b5cf6' },
          { name: 'Proposal', order: 4, color: '#f59e0b' },
          { name: 'Negotiation', order: 5, color: '#f97316' },
          { name: 'Won', order: 6, color: '#22c55e', isClosed: true, isWon: true },
          { name: 'Lost', order: 7, color: '#ef4444', isClosed: true },
        ],
      },
    },
  });

  // ─── Demo Org ───
  const now = new Date();
  const org = await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      name: 'Acme Corp',
      industry: 'Technology',
      country: 'SG',
      email: 'contact@acmecorp.com',
      phone: '+6591234567',
      contractStartDate: new Date('2025-01-01'),
      contractEndDate: new Date('2026-12-31'),
      renewalDate: new Date('2026-11-01'),
      contractValue: 24000,
      renewalStatus: 'UPCOMING',
      followUpStatus: 'PENDING',
      nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      followUpPriority: 'HIGH',
      riskScore: 35,
      createdBy: adminUser.id,
    },
  });

  // ─── Additional Demo Organizations ───
  const org2 = await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      name: 'Global Industries Ltd',
      industry: 'Manufacturing',
      country: 'US',
      email: 'info@globalindustries.com',
      phone: '+12025551234',
      contractStartDate: new Date('2024-06-01'),
      contractEndDate: new Date('2025-05-31'),
      renewalDate: new Date('2025-04-01'),
      contractValue: 48000,
      renewalStatus: 'OVERDUE',
      followUpStatus: 'MISSED',
      nextFollowUpAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      followUpPriority: 'CRITICAL',
      riskScore: 72,
      createdBy: adminUser.id,
    },
  });

  const org3 = await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      name: 'Pinnacle Solutions',
      industry: 'Consulting',
      country: 'GB',
      email: 'hello@pinnaclesolutions.co.uk',
      phone: '+442071234567',
      contractStartDate: new Date('2025-03-01'),
      contractEndDate: new Date('2026-02-28'),
      renewalDate: new Date('2026-01-15'),
      contractValue: 36000,
      renewalStatus: 'RENEWED',
      followUpStatus: 'COMPLETED',
      nextFollowUpAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      followUpPriority: 'MEDIUM',
      riskScore: 15,
      createdBy: adminUser.id,
    },
  });

  // ─── Demo Contacts ───
  const contact1 = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      firstName: 'John',
      lastName: 'Chen',
      email: 'john.chen@acmecorp.com',
      phone: '+6591234568',
      jobTitle: 'CTO',
      organizationId: org.id,
      createdBy: adminUser.id,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.w@globalindustries.com',
      phone: '+12025551235',
      jobTitle: 'VP of Operations',
      organizationId: org2.id,
      createdBy: adminUser.id,
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      firstName: 'Raj',
      lastName: 'Patel',
      email: 'raj@pinnaclesolutions.co.uk',
      phone: '+442071234568',
      jobTitle: 'Managing Director',
      organizationId: org3.id,
      createdBy: adminUser.id,
    },
  });

  const contact4 = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      firstName: 'Emily',
      lastName: 'Tan',
      email: 'emily.tan@acmecorp.com',
      phone: '+6591234569',
      jobTitle: 'Procurement Manager',
      organizationId: org.id,
      createdBy: adminUser.id,
    },
  });

  // ─── Demo Leads ───
  const stages = await prisma.stage.findMany({ where: { pipelineId: pipeline.id }, orderBy: { order: 'asc' } });

  await prisma.lead.createMany({
    data: [
      {
        tenantId: tenant.id,
        title: 'Acme Corp - Enterprise Upgrade',
        description: 'Acme Corp wants to upgrade from Starter to Enterprise plan',
        status: 'QUALIFIED',
        source: 'REFERRAL',
        value: 48000,
        organizationId: org.id,
        contactId: contact1.id,
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
        stageId: stages[2]?.id,
      },
      {
        tenantId: tenant.id,
        title: 'Global Industries - Annual Contract',
        description: 'New annual contract negotiation for manufacturing automation tools',
        status: 'PROPOSAL',
        source: 'WEBSITE',
        value: 96000,
        organizationId: org2.id,
        contactId: contact2.id,
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
        stageId: stages[4]?.id,
      },
      {
        tenantId: tenant.id,
        title: 'Pinnacle Solutions - Consulting Package',
        description: 'Consulting services for digital transformation',
        status: 'CONTACTED',
        source: 'LINKEDIN',
        value: 36000,
        organizationId: org3.id,
        contactId: contact3.id,
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
        stageId: stages[1]?.id,
      },
      {
        tenantId: tenant.id,
        title: 'New Prospect - Tech Startup',
        description: 'Inbound lead from website form',
        status: 'NEW',
        source: 'WEBSITE',
        value: 12000,
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
        stageId: stages[0]?.id,
      },
      {
        tenantId: tenant.id,
        title: 'Repeat Client - Acme Training',
        description: 'Training modules for Acme Corp team',
        status: 'WON',
        source: 'REFERRAL',
        value: 8500,
        organizationId: org.id,
        contactId: contact4.id,
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
        stageId: stages[5]?.id,
      },
    ],
  });

  // ─── Demo Follow-Ups ───
  await prisma.followUp.createMany({
    data: [
      {
        tenantId: tenant.id,
        title: 'Follow up on Acme Corp upgrade proposal',
        notes: 'Send updated pricing and schedule a demo',
        status: 'PENDING',
        priority: 'HIGH',
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        organizationId: org.id,
        contactId: contact1.id,
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id,
        title: 'Global Industries contract renewal check',
        notes: 'Contract expiry approaching — discuss renewal terms',
        status: 'MISSED',
        priority: 'CRITICAL',
        dueAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        organizationId: org2.id,
        contactId: contact2.id,
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id,
        title: 'Pinnacle quarterly review',
        notes: 'Schedule quarterly business review with Raj Patel',
        status: 'PENDING',
        priority: 'MEDIUM',
        dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        organizationId: org3.id,
        contactId: contact3.id,
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id,
        title: 'Send welcome email to new prospect',
        notes: 'Automated follow-up for tech startup lead',
        status: 'COMPLETED',
        priority: 'LOW',
        dueAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
      },
    ],
  });

  // ─── Demo Communications ───
  await prisma.communication.createMany({
    data: [
      {
        tenantId: tenant.id,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        subject: 'Proposal for Enterprise Upgrade',
        body: 'Hi John, please find attached our updated proposal for the enterprise upgrade. Let me know if you have any questions.',
        organizationId: org.id,
        contactId: contact1.id,
      },
      {
        tenantId: tenant.id,
        channel: 'PHONE',
        direction: 'INBOUND',
        subject: 'Contract renewal discussion',
        body: 'Sarah called to discuss renewal terms. She mentioned budget concerns for next fiscal year.',
        organizationId: org2.id,
        contactId: contact2.id,
      },
      {
        tenantId: tenant.id,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        subject: 'Quarterly Review Invitation',
        body: 'Hi Raj, I would like to schedule our quarterly review. Please let me know your availability.',
        organizationId: org3.id,
        contactId: contact3.id,
      },
    ],
  });

  // ─── Demo Tasks ───
  await prisma.task.createMany({
    data: [
      {
        tenantId: tenant.id,
        title: 'Prepare Acme Corp proposal deck',
        description: 'Create a customized slide deck for the enterprise upgrade pitch',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id,
        title: 'Research competitor pricing',
        description: 'Gather competitor pricing info for the Global Industries negotiation',
        status: 'OPEN',
        priority: 'MEDIUM',
        dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
      },
      {
        tenantId: tenant.id,
        title: 'Update CRM contact records',
        description: 'Ensure all recent contact info is synced',
        status: 'DONE',
        priority: 'LOW',
        dueAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        assignedTo: adminUser.id,
        createdBy: adminUser.id,
      },
    ],
  });

  // ─── Demo Notes ───
  await prisma.note.createMany({
    data: [
      {
        tenantId: tenant.id,
        content: 'Acme Corp is very interested in our AI features. Their CTO John Chen was particularly impressed during the demo.',
        organizationId: org.id,
        createdBy: adminUser.id,
        isPinned: true,
      },
      {
        tenantId: tenant.id,
        content: 'Global Industries might switch to a competitor if we don\'t offer better pricing. Need to escalate.',
        organizationId: org2.id,
        createdBy: adminUser.id,
        isPinned: true,
      },
      {
        tenantId: tenant.id,
        content: 'Raj mentioned Pinnacle is expanding to Asia. Potential for a larger contract in Q3.',
        organizationId: org3.id,
        contactId: contact3.id,
        createdBy: adminUser.id,
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log(`   Tenant: ${tenant.slug}`);
  console.log(`   Admin: admin@srpaios.demo / Admin@1234`);
  console.log(`   Organizations: 3 (Acme Corp, Global Industries, Pinnacle Solutions)`);
  console.log(`   Contacts: 4 | Leads: 5 | Follow-ups: 4 | Tasks: 3 | Communications: 3`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
