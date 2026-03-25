import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tenantId = session.user.tenantId;
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    totalOrgs,
    atRiskCount,
    totalContractValue,
    followUpsDueToday,
    overdueFollowUps,
    renewalsDueSoon,
    totalLeads,
    wonLeads,
    recentActivity,
    followUpsByStatus,
    orgsByRisk,
    revenueByMonth,
  ] = await Promise.all([
    prisma.organization.count({ where: { tenantId } }),
    prisma.organization.count({ where: { tenantId, riskScore: { gte: 60 } } }),
    prisma.organization.aggregate({ where: { tenantId, contractValue: { not: null, gt: 0 } }, _sum: { contractValue: true } }),
    prisma.followUp.count({
      where: {
        tenantId,
        status: { in: ['PENDING'] },
        dueAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.followUp.count({
      where: {
        tenantId,
        status: { in: ['PENDING'] },
        dueAt: { lt: todayStart },
      },
    }),
    prisma.organization.count({
      where: {
        tenantId,
        renewalDate: { gte: now, lte: subDays(now, -30) },
      },
    }),
    prisma.lead.count({ where: { tenantId } }),
    prisma.lead.count({ where: { tenantId, status: 'WON' } }),
    prisma.activity.findMany({
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { organization: { select: { name: true } } },
    }),
    prisma.followUp.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    }),
    prisma.organization.groupBy({
      by: ['followUpStatus'],
      where: { tenantId },
      _count: true,
    }),
    prisma.organization.findMany({
      where: { tenantId, contractValue: { not: null, gt: 0 } },
      select: { contractValue: true, contractStartDate: true },
      take: 200,
    }),
  ]);

  // Build monthly revenue buckets for current year
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), i, 1);
    return { month: d.toLocaleString('default', { month: 'short' }), value: 0 };
  });

  revenueByMonth.forEach((org: any) => {
    if (org.contractStartDate) {
      const m = new Date(org.contractStartDate).getMonth();
      months[m].value += org.contractValue ?? 0;
    }
  });

  return NextResponse.json({
    data: {
      overview: {
        totalOrgs,
        atRiskCount,
        totalContractValue: totalContractValue._sum.contractValue ?? 0,
        followUpsDueToday,
        overdueFollowUps,
        renewalsDueSoon,
        totalLeads,
        wonLeads,
        conversionRate: totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
      },
      followUpsByStatus,
      orgsByRisk,
      recentActivity,
      revenueByMonth: months,
    },
  });
}
