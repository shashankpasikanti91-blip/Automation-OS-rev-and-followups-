import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    const tenantId = ctx.tenantId;

    const [
      leadCount,
      contactCount,
      integrationCount,
      templateCount,
      webhookCount,
      followUpCount,
      communicationCount,
    ] = await Promise.all([
      prisma.lead.count({ where: { tenantId, isDeleted: false } }),
      prisma.contact.count({ where: { tenantId, isDeleted: false } }),
      prisma.integration.count({ where: { tenantId, enabled: true } }),
      prisma.communicationTemplate.count({ where: { tenantId } }),
      prisma.webhook.count({ where: { tenantId, isActive: true } }),
      prisma.followUp.count({ where: { tenantId, isDeleted: false } }),
      prisma.communication.count({ where: { tenantId } }),
    ]);

    const steps = [
      { key: 'first_lead', label: 'Create your first lead', done: leadCount > 0, href: '/crm/leads' },
      { key: 'first_contact', label: 'Add a contact', done: contactCount > 0, href: '/crm/contacts' },
      { key: 'connect_integration', label: 'Enable an integration', done: integrationCount > 0, href: '/settings' },
      { key: 'create_template', label: 'Create a communication template', done: templateCount > 0, href: '/communications/templates' },
      { key: 'add_webhook', label: 'Configure a webhook (n8n/Zapier)', done: webhookCount > 0, href: '/settings' },
      { key: 'first_followup', label: 'Schedule a follow-up', done: followUpCount > 0, href: '/revenue/follow-ups' },
      { key: 'first_communication', label: 'Draft a communication', done: communicationCount > 0, href: '/communications' },
    ];

    const completed = steps.filter((s) => s.done).length;

    return apiSuccess({ steps, completed, total: steps.length });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch setup status', 500);
  }
}
