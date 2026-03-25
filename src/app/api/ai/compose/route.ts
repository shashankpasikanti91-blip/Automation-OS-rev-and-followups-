import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantContext } from '@/lib/tenant';
import { apiSuccess, apiError } from '@/lib/api';
import { z } from 'zod';

const composeSchema = z.object({
  type: z.string().min(1),
  context: z.string().optional(),
  tone: z.string().default('professional'),
  channel: z.enum(['EMAIL', 'SMS', 'WHATSAPP']).default('EMAIL'),
});

const TYPE_PROMPTS: Record<string, string> = {
  follow_up_email: 'Write a follow-up email to check in on a previous conversation or proposal.',
  renewal_reminder: 'Write a friendly renewal reminder for a contract that is coming up for renewal.',
  re_engagement: 'Write a re-engagement message to reconnect with an inactive client.',
  introduction: 'Write an introductory message to a new contact or prospect.',
  thank_you: 'Write a thank-you message after a meeting or successful interaction.',
  proposal: 'Write a follow-up message after sending a proposal to check on decision status.',
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenantContext();
    const body = await req.json();
    const parsed = composeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(apiError('Validation failed', 400, parsed.error.flatten()), { status: 400 });
    }

    const { type, context, tone, channel } = parsed.data;

    // Check if AI is configured
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const aiProvider = process.env.AI_PROVIDER ?? 'openai';

    if (aiProvider === 'openai' && !openaiKey) {
      return NextResponse.json(
        apiError('OpenAI API key not configured. Go to Settings to set up AI integration, or ask your admin to configure the OPENAI_API_KEY.', 422),
        { status: 422 }
      );
    }
    if (aiProvider === 'anthropic' && !anthropicKey) {
      return NextResponse.json(
        apiError('Anthropic API key not configured. Ask your admin to configure the ANTHROPIC_API_KEY.', 422),
        { status: 422 }
      );
    }

    const channelGuidance = channel === 'SMS' ? 'Keep the message concise, under 160 characters.' :
      channel === 'WHATSAPP' ? 'Keep the message conversational and brief.' :
        'Include a subject line on the first line, then the email body.';

    const typePrompt = TYPE_PROMPTS[type] ?? 'Write a professional outreach message.';

    const systemPrompt = `You are a professional business communication assistant. ${typePrompt}

Guidelines:
- Tone: ${tone}
- Channel: ${channel}
- ${channelGuidance}
- Be specific and actionable
- Do not include placeholders like [Name] — use general professional greetings instead
- Keep the message genuine and not overly sales-focused`;

    const userPrompt = context
      ? `Additional context: ${context}\n\nGenerate the message.`
      : 'Generate the message.';

    let content = '';

    if (aiProvider === 'openai' && openaiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(apiError(`AI generation failed: ${err.error?.message ?? 'Unknown error'}`, 500), { status: 500 });
      }

      const aiRes = await res.json();
      content = aiRes.choices?.[0]?.message?.content ?? '';
    } else if (aiProvider === 'anthropic' && anthropicKey) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          max_tokens: 500,
        }),
      });

      if (!res.ok) {
        return NextResponse.json(apiError('AI generation failed', 500), { status: 500 });
      }

      const aiRes = await res.json();
      content = aiRes.content?.[0]?.text ?? '';
    }

    // Log the AI job
    await prisma.aiJob.create({
      data: {
        tenantId: ctx.tenantId,
        type: 'compose_message',
        status: 'DONE',
        prompt: JSON.stringify({ type, context, tone, channel }),
        result: { content } as any,
        provider: aiProvider,
        model: aiProvider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-haiku',
      },
    });

    return apiSuccess({ content });
  } catch (err: any) {
    if (err.message === 'UNAUTHENTICATED') return apiError('Unauthorized', 401);
    console.error('[AI Compose Error]', err);
    return apiError('AI composition failed', 500);
  }
}
