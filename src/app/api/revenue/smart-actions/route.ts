import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const tenantId = ctx.tenantId;
    const now = new Date();
    const today = new Date(now.toDateString());
    const sevenDaysOut = new Date(today);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

    const [
      overdueFollowUps,
      renewalsDue7d,
      atRiskOrgs,
      draftComms,
      hasSmtpIntegration,
      hasWhatsAppIntegration,
      hasWebhook,
    ] = await Promise.all([
      prisma.followUp.count({
        where: { tenantId, isDeleted: false, status: 'PENDING', dueAt: { lt: now } },
      }),
      prisma.renewalEvent.count({
        where: { tenantId, renewalDate: { gte: today, lte: sevenDaysOut }, renewalStatus: { in: ['UPCOMING', 'DUE'] } },
      }),
      prisma.organization.count({
        where: { tenantId, isDeleted: false, riskScore: { gte: 70 } },
      }),
      prisma.communication.count({
        where: { tenantId, status: 'DRAFT' },
      }),
      prisma.integration.findFirst({
        where: { tenantId, key: 'smtp', enabled: true },
      }),
      prisma.integration.findFirst({
        where: { tenantId, key: 'whatsapp', enabled: true },
      }),
      prisma.webhook.findFirst({
        where: { tenantId, isActive: true },
      }),
    ]);

    const actions: any[] = [];

    if (overdueFollowUps > 0) {
      actions.push({
        id: 'overdue_followups',
        type: 'overdue_followups',
        title: `${overdueFollowUps} overdue follow-up${overdueFollowUps > 1 ? 's' : ''}`,
        description: 'These follow-ups have passed their due date and need attention.',
        count: overdueFollowUps,
        severity: 'danger',
        href: '/revenue/follow-ups?status=PENDING&overdue=true',
        actionLabel: 'Review',
      });
    }

    if (renewalsDue7d > 0) {
      actions.push({
        id: 'upcoming_renewals',
        type: 'upcoming_renewals',
        title: `${renewalsDue7d} renewal${renewalsDue7d > 1 ? 's' : ''} due within 7 days`,
        description: 'Contract renewals coming up soon that may need action.',
        count: renewalsDue7d,
        severity: 'warning',
        href: '/revenue/renewals?daysAhead=7',
        actionLabel: 'Review',
      });
    }

    if (atRiskOrgs > 0) {
      actions.push({
        id: 'at_risk',
        type: 'at_risk',
        title: `${atRiskOrgs} at-risk account${atRiskOrgs > 1 ? 's' : ''}`,
        description: 'Companies with a risk score of 70 or higher that may need intervention.',
        count: atRiskOrgs,
        severity: 'danger',
        href: '/revenue/at-risk',
        actionLabel: 'View',
      });
    }

    if (draftComms > 0) {
      actions.push({
        id: 'draft_messages',
        type: 'draft_messages',
        title: `${draftComms} unsent draft${draftComms > 1 ? 's' : ''}`,
        description: 'Messages saved as drafts that are waiting to be sent.',
        count: draftComms,
        severity: 'info',
        href: '/communications',
        actionLabel: 'View',
      });
    }

    if (!hasSmtpIntegration) {
      actions.push({
        id: 'no_smtp',
        type: 'no_integration',
        title: 'Email integration not connected',
        description: 'Connect your SMTP or Gmail to send emails directly from the platform.',
        severity: 'warning',
        href: '/settings',
        actionLabel: 'Set Up',
      });
    }

    if (!hasWebhook) {
      actions.push({
        id: 'no_webhook',
        type: 'no_integration',
        title: 'No automation webhook connected',
        description: 'Connect an n8n webhook to automate follow-ups, notifications, and workflows.',
        severity: 'info',
        href: '/settings',
        actionLabel: 'Set Up',
      });
    }

    return apiSuccess(actions);
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to compute smart actions', 500);
  }
}
