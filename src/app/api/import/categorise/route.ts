import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

// POST /api/import/categorise
// Body: { merchants: string[], tags: { id: string; label: string; category: 'income'|'expense'|'both' }[] }
// Returns: { [merchant: string]: { tag: string; category: 'income'|'expense' } }
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { merchants, tags } = await req.json();
    if (!Array.isArray(merchants) || merchants.length === 0) {
      return NextResponse.json({ error: 'merchants array required' }, { status: 400 });
    }

    const tagList = (tags as { id: string; label: string; category: string }[])
      .map((t) => `${t.id} (${t.label}, ${t.category})`)
      .join('\n');

    const prompt = `You are a personal finance categoriser. Given a list of merchant/transaction names and available tags, assign each merchant the most appropriate tag and category.

Available tags (id, label, category):
${tagList}

Merchants to categorise:
${merchants.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}

Respond ONLY with a valid JSON object mapping each merchant name to an object with "tag" (the tag id) and "category" ("income" or "expense"). Do not include any explanation or markdown.
Example: {"Tesco": {"tag": "food", "category": "expense"}, "HMRC": {"tag": "tax_refund", "category": "income"}}`;

    const message = await client.chat.completions.create({
      model: 'grok-3-mini',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = message.choices[0]?.message?.content?.trim() ?? '{}';

    // Strip markdown code fences if model wrapped the JSON
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    // Extract just the JSON object in case there's surrounding text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    let result: Record<string, { tag: string; category: string }> = {};
    try {
      result = JSON.parse(text);
    } catch {
      console.error('[import/categorise] Failed to parse Grok response:', text.slice(0, 500));
    }

    return NextResponse.json({ categorisations: result });
  } catch (error) {
    console.error('[import/categorise] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
