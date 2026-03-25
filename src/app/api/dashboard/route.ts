import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';
import { subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const tenantId = ctx.tenantId;
    const now = new Date();
    const today = new Date(now.toDateString());
    const next30 = new Date(today);
    next30.setDate(next30.getDate() + 30);
    const last30 = subDays(today, 30);

    const [
      totalLeads,
      totalContacts,
      totalOrgs,
      overdueFollowUps,
      todayFollowUps,
      upcomingRenewals,
      overdueRenewals,
      atRiskOrgs,
      openTasks,
      recentActivities,
      aiUsage,
    ] = await Promise.all([
      prisma.lead.count({ where: { tenantId, isDeleted: false } }),
      prisma.contact.count({ where: { tenantId, isDeleted: false } }),
      prisma.organization.count({ where: { tenantId, isDeleted: false } }),
      prisma.followUp.count({
        where: { tenantId, isDeleted: false, status: 'PENDING', dueAt: { lt: now } },
      }),
      prisma.followUp.count({
        where: {
          tenantId,
          isDeleted: false,
          status: 'PENDING',
          dueAt: { gte: today, lt: new Date(today.getTime() + 86400000) },
        },
      }),
      prisma.renewalEvent.count({
        where: { tenantId, renewalDate: { gte: now, lte: next30 }, renewalStatus: { in: ['UPCOMING', 'DUE'] } },
      }),
      prisma.renewalEvent.count({
        where: { tenantId, renewalDate: { lt: now }, renewalStatus: 'OVERDUE' },
      }),
      prisma.organization.count({
        where: { tenantId, isDeleted: false, riskScore: { gte: 70 } },
      }),
      prisma.task.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.activity.findMany({
        where: { tenantId, createdAt: { gte: last30 } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { name: true, avatarUrl: true } },
          organization: { select: { name: true } },
        },
      }),
      prisma.aiJob.count({ where: { tenantId, status: 'DONE', createdAt: { gte: last30 } } }),
    ]);

    // Revenue trend (last 6 months)
    const revenueTrend = await prisma.$queryRaw<Array<{ month: string; value: number }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "renewalDate"), 'Mon YY') AS month,
        COALESCE(SUM("contractValue"), 0) AS value
      FROM "RenewalEvent"
      WHERE "tenantId" = ${tenantId}
        AND "renewalDate" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "renewalDate")
      ORDER BY DATE_TRUNC('month', "renewalDate")
    `;

    return apiSuccess({
      kpis: {
        totalLeads,
        totalContacts,
        totalOrganizations: totalOrgs,
        overdueFollowUps,
        todayFollowUps,
        upcomingRenewals,
        overdueRenewals,
        atRiskClients: atRiskOrgs,
        openTasks,
        aiUsageLast30d: aiUsage,
      },
      revenueTrend,
      recentActivities,
    });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    return apiError('Failed to fetch dashboard data', 500);
  }
}
