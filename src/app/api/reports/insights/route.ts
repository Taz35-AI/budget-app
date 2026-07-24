import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import OpenAI from 'openai';

// POST /api/reports/insights
// Body: { monthLabel, income, expense, net, savingsRate, topCategories, prevMonthNet, txCount, currency }
// Returns: { advice: string }

/** Coerces to a finite number, else 0 — the body is client-supplied. */
function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Trims free-text so it can't be used to smuggle a huge prompt. */
function text(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ error: 'AI insights are not configured' }, { status: 503 });
    }

    // 10 generations/hour — enough for a user reviewing every month of the
    // year, far below what a runaway loop would burn.
    const limit = rateLimit(`insights:${userId}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many insight requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const monthLabel = text(body.monthLabel, 40) || 'This month';
    const currency = text(body.currency, 4);
    const income = num(body.income);
    const expense = num(body.expense);
    const net = num(body.net);
    const txCount = Math.max(0, Math.trunc(num(body.txCount)));
    const savingsRate = body.savingsRate === null || body.savingsRate === undefined
      ? null
      : num(body.savingsRate);
    const prevMonthNet = body.prevMonthNet === null || body.prevMonthNet === undefined
      ? null
      : num(body.prevMonthNet);

    const topCatsText = (Array.isArray(body.topCategories) ? body.topCategories : [])
      .slice(0, 5)
      .map((c: unknown) => {
        const cat = (c ?? {}) as { label?: unknown; amount?: unknown };
        return `${text(cat.label, 40)}: ${currency}${num(cat.amount).toFixed(2)}`;
      })
      .join(', ');

    const client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });

    const prompt = `You are a personal finance advisor. Write 3-4 sentences of specific, honest financial advice based on these exact numbers. Reference the actual figures. Be direct and actionable — no generic platitudes, no bullet points, no headers, just plain text.

Month: ${monthLabel}
Income: ${currency}${income.toFixed(2)}
Expenses: ${currency}${expense.toFixed(2)}
Net: ${currency}${net.toFixed(2)}
Savings rate: ${savingsRate !== null ? savingsRate + '%' : 'N/A'}
${prevMonthNet !== null ? `Previous month net: ${currency}${prevMonthNet.toFixed(2)}` : ''}
Transactions: ${txCount}
Top spending categories: ${topCatsText}`;

    const message = await client.chat.completions.create({
      model: 'grok-3-mini',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const advice = message.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ advice });
  } catch (error) {
    console.error('[reports/insights] error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
