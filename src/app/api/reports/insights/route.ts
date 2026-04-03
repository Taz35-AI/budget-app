import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import OpenAI from 'openai';

// POST /api/reports/insights
// Body: { monthLabel, income, expense, net, savingsRate, topCategories, prevMonthNet, txCount, currency }
// Returns: { advice: string }
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { monthLabel, income, expense, net, savingsRate, topCategories, prevMonthNet, txCount, currency } =
      await req.json();

    const client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });

    const topCatsText = (topCategories as Array<{ label: string; amount: number }>)
      .slice(0, 5)
      .map((c) => `${c.label}: ${currency}${c.amount.toFixed(2)}`)
      .join(', ');

    const prompt = `You are a personal finance advisor. Write 3-4 sentences of specific, honest financial advice based on these exact numbers. Reference the actual figures. Be direct and actionable — no generic platitudes, no bullet points, no headers, just plain text.

Month: ${monthLabel}
Income: ${currency}${income.toFixed(2)}
Expenses: ${currency}${expense.toFixed(2)}
Net: ${currency}${net.toFixed(2)}
Savings rate: ${savingsRate !== null ? savingsRate + '%' : 'N/A'}
${prevMonthNet !== null ? `Previous month net: ${currency}${(prevMonthNet as number).toFixed(2)}` : ''}
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
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
