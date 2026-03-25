import { prisma } from '@/lib/prisma';

export type WebhookEvent =
  | 'lead.created'
  | 'lead.updated'
  | 'contact.created'
  | 'followup.created'
  | 'followup.completed'
  | 'followup.missed'
  | 'communication.send_requested'
  | 'contract.created'
  | 'contract.expiring'
  | 'renewal.due'
  | 'renewal.overdue'
  | 'ai.generate_requested'
  | 'document.uploaded';

interface WebhookPayload {
  event: WebhookEvent;
  tenantId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

interface WebhookRow {
  id: string;
  url: string;
  secret: string | null;
  events: string[];
  isActive: boolean;
}

/**
 * Fire webhook for all active registered webhooks matching the event.
 * Non-blocking — errors are logged but don't propagate.
 */
export async function fireWebhook(tenantId: string, event: WebhookEvent, data: Record<string, unknown>) {
  try {
    const webhooks: WebhookRow[] = await prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      tenantId,
      data,
      timestamp: new Date().toISOString(),
    };

    const results = await Promise.allSettled(
      webhooks.map(async (wh) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event,
        };
        if (wh.secret) {
          const { createHmac } = await import('crypto');
          const sig = createHmac('sha256', wh.secret)
            .update(JSON.stringify(payload))
            .digest('hex');
          headers['X-Webhook-Signature'] = sig;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const res = await fetch(wh.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          await prisma.webhookLog.create({
            data: {
              webhookId: wh.id,
              event,
              payload: payload as any,
              statusCode: res.status,
              success: res.ok,
              response: await res.text().catch(() => ''),
            },
          });

          return { webhookId: wh.id, success: res.ok, status: res.status };
        } catch (err: any) {
          clearTimeout(timeoutId);
          await prisma.webhookLog.create({
            data: {
              webhookId: wh.id,
              event,
              payload: payload as any,
              success: false,
              response: err.message ?? 'Unknown error',
            },
          });
          return { webhookId: wh.id, success: false, error: err.message };
        }
      })
    );

    return results;
  } catch (err) {
    console.error('[Webhook] Failed to fire webhooks:', err);
  }
}

/**
 * Get available webhook events for documentation / settings UI.
 */
export function getAvailableEvents(): { event: WebhookEvent; description: string }[] {
  return [
    { event: 'lead.created', description: 'When a new lead is created' },
    { event: 'lead.updated', description: 'When a lead status changes' },
    { event: 'contact.created', description: 'When a new contact is added' },
    { event: 'followup.created', description: 'When a follow-up is scheduled' },
    { event: 'followup.completed', description: 'When a follow-up is marked complete' },
    { event: 'followup.missed', description: 'When a follow-up passes its due date' },
    { event: 'communication.send_requested', description: 'When a message send is requested' },
    { event: 'contract.created', description: 'When a contract is created' },
    { event: 'contract.expiring', description: 'When a contract is nearing expiry' },
    { event: 'renewal.due', description: 'When a renewal is coming due' },
    { event: 'renewal.overdue', description: 'When a renewal is overdue' },
    { event: 'ai.generate_requested', description: 'When an AI generation is triggered' },
    { event: 'document.uploaded', description: 'When a document is uploaded' },
  ];
}
