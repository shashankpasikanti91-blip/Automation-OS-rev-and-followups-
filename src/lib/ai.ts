/**
 * SRP AI OS — AI Service Layer
 * Provider-agnostic abstraction for OpenAI / Anthropic
 */

import { prisma } from '@/lib/prisma';

export type AiProvider = 'openai' | 'anthropic';

interface AiCallOptions {
  tenantId: string;
  type: string;
  prompt: string;
  systemPrompt?: string;
  language?: string;
  maxTokens?: number;
  temperature?: number;
}

interface AiResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  provider: string;
  model: string;
}

async function callOpenAi(prompt: string, systemPrompt: string, maxTokens: number, temperature: number): Promise<AiResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const model = 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} — ${err}`);
  }

  const json = await res.json();
  return {
    content: json.choices[0]?.message?.content ?? '',
    inputTokens: json.usage?.prompt_tokens ?? 0,
    outputTokens: json.usage?.completion_tokens ?? 0,
    provider: 'openai',
    model,
  };
}

async function callAnthropic(prompt: string, systemPrompt: string, maxTokens: number, temperature: number): Promise<AiResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const model = 'claude-3-5-haiku-20241022';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} — ${err}`);
  }

  const json = await res.json();
  return {
    content: json.content[0]?.text ?? '',
    inputTokens: json.usage?.input_tokens ?? 0,
    outputTokens: json.usage?.output_tokens ?? 0,
    provider: 'anthropic',
    model,
  };
}

export async function runAiJob(options: AiCallOptions): Promise<string> {
  const {
    tenantId,
    type,
    prompt,
    systemPrompt = 'You are SRP AI OS, an intelligent assistant for service business operations.',
    language = 'en',
    maxTokens = 1024,
    temperature = 0.7,
  } = options;

  const provider = (process.env.AI_PROVIDER as AiProvider) ?? 'openai';
  const langInstruction = language !== 'en' ? `\n\nRespond in language: ${language}` : '';
  const fullSystem = systemPrompt + langInstruction;

  const job = await prisma.aiJob.create({
    data: {
      tenantId,
      type,
      prompt,
      status: 'RUNNING',
      provider,
      startedAt: new Date(),
    },
  });

  try {
    let result: AiResult;
    if (provider === 'anthropic') {
      result = await callAnthropic(prompt, fullSystem, maxTokens, temperature);
    } else {
      result = await callOpenAi(prompt, fullSystem, maxTokens, temperature);
    }

    await prisma.aiJob.update({
      where: { id: job.id },
      data: {
        status: 'DONE',
        result: { content: result.content },
        model: result.model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        finishedAt: new Date(),
      },
    });

    return result.content;
  } catch (err: any) {
    await prisma.aiJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', error: err.message, finishedAt: new Date() },
    });
    throw err;
  }
}

// ─── Specialized AI Helpers ───

export async function generateFollowUpMessage(opts: {
  tenantId: string;
  contactName: string;
  companyName?: string;
  context: string;
  channel: string;
  language?: string;
}): Promise<string> {
  const prompt = `Write a professional ${opts.channel} follow-up message for:
Contact: ${opts.contactName}
Company: ${opts.companyName ?? 'N/A'}
Context: ${opts.context}

Requirements:
- Concise and professional
- Clear call to action
- Friendly but business-appropriate
- Maximum 150 words`;

  return runAiJob({
    tenantId: opts.tenantId,
    type: 'follow_up_message',
    prompt,
    language: opts.language ?? 'en',
  });
}

export async function generateRenewalReminder(opts: {
  tenantId: string;
  contactName: string;
  companyName?: string;
  renewalDate: string;
  contractValue?: number;
  currency?: string;
  language?: string;
}): Promise<string> {
  const valueStr = opts.contractValue ? ` (${opts.currency ?? ''} ${opts.contractValue.toLocaleString()})` : '';
  const prompt = `Write a professional renewal reminder for:
Contact: ${opts.contactName}
Company: ${opts.companyName ?? 'N/A'}
Renewal Date: ${opts.renewalDate}
Contract Value: ${valueStr}

Requirements:
- Professional and warm
- Highlight renewal date clearly
- Easy next step
- Maximum 120 words`;

  return runAiJob({
    tenantId: opts.tenantId,
    type: 'renewal_reminder',
    prompt,
    language: opts.language ?? 'en',
  });
}

export async function summarizeClientHistory(opts: {
  tenantId: string;
  contactName: string;
  activities: string[];
  language?: string;
}): Promise<string> {
  const prompt = `Summarize the client relationship history for ${opts.contactName}:
Activities:
${opts.activities.join('\n')}

Provide:
1. Relationship summary (2-3 sentences)
2. Key patterns or concerns
3. Recommended next action`;

  return runAiJob({
    tenantId: opts.tenantId,
    type: 'client_summary',
    prompt,
    language: opts.language ?? 'en',
    maxTokens: 512,
  });
}

export async function explainRiskScore(opts: {
  tenantId: string;
  entityName: string;
  riskScore: number;
  factors: string[];
  language?: string;
}): Promise<string> {
  const prompt = `Explain the risk score for client: ${opts.entityName}
Risk Score: ${opts.riskScore}/100
Risk Factors: ${opts.factors.join(', ')}

Provide a brief plain-language explanation and 2-3 suggested actions to reduce risk.`;

  return runAiJob({
    tenantId: opts.tenantId,
    type: 'risk_explanation',
    prompt,
    language: opts.language ?? 'en',
    maxTokens: 384,
  });
}

export async function extractDocumentData(opts: {
  tenantId: string;
  documentText: string;
  documentType?: string;
  documentId?: string;
}): Promise<Record<string, unknown>> {
  const typeHint = opts.documentType ? `Document Type: ${opts.documentType}` : '';
  const prompt = `Extract structured data from this document.
${typeHint}

Document Text:
${opts.documentText.slice(0, 8000)}

Return a JSON object with extracted fields such as:
- names, dates, amounts, policy numbers, contract terms, contact info
- Only include fields that are clearly present
- Use null for missing values
- Return valid JSON only`;

  const content = await runAiJob({
    tenantId: opts.tenantId,
    type: 'document_extraction',
    prompt,
    systemPrompt: 'You are a document extraction AI. Return only valid JSON, no markdown, no preamble.',
    language: 'en',
    maxTokens: 2048,
    temperature: 0.1,
  });

  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { raw: content };
  }
}
