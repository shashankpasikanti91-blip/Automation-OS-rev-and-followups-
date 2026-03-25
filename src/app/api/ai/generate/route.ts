import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';
import { generateFollowUpMessage, generateRenewalReminder, explainRiskScore } from '@/lib/ai';
import { z } from 'zod';

const followUpSchema = z.object({
  contactName: z.string().min(1),
  companyName: z.string().optional(),
  context: z.string().min(5),
  channel: z.enum(['email', 'whatsapp', 'sms', 'phone']),
  language: z.string().default('en'),
});

const renewalSchema = z.object({
  contactName: z.string().min(1),
  companyName: z.string().optional(),
  renewalDate: z.string(),
  contractValue: z.number().optional(),
  currency: z.string().optional(),
  language: z.string().default('en'),
});

const riskSchema = z.object({
  entityName: z.string().min(1),
  riskScore: z.number().min(0).max(100),
  factors: z.array(z.string()),
  language: z.string().default('en'),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();
    const { type, ...data } = body;

    let result: string;

    if (type === 'follow_up') {
      const parsed = followUpSchema.parse(data);
      result = await generateFollowUpMessage({ tenantId: ctx.tenantId, ...parsed });
    } else if (type === 'renewal_reminder') {
      const parsed = renewalSchema.parse(data);
      result = await generateRenewalReminder({ tenantId: ctx.tenantId, ...parsed });
    } else if (type === 'risk_explanation') {
      const parsed = riskSchema.parse(data);
      result = await explainRiskScore({ tenantId: ctx.tenantId, ...parsed });
    } else {
      return apiError('Unknown AI job type', 400);
    }

    return apiSuccess({ content: result });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    if (err.name === 'ZodError') return apiError('Invalid input', 422);
    return apiError('AI generation failed', 500);
  }
}
