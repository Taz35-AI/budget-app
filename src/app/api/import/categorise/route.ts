import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import OpenAI from 'openai';

// POST /api/import/categorise
// Body: { merchants: string[], tags: { id: string; label: string; category: 'income'|'expense'|'both' }[] }
// Returns: { [merchant: string]: { tag: string; category: 'income'|'expense' } }
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Instantiate lazily so the build doesn't fail when XAI_API_KEY is absent
    const client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });

    const { merchants, tags } = await req.json();
    if (!Array.isArray(merchants) || merchants.length === 0) {
      return NextResponse.json({ error: 'merchants array required' }, { status: 400 });
    }

    const tagIds = (tags as { id: string }[]).map((t) => t.id).join(', ');

    // Use index-based response to avoid key-matching issues with long merchant names
    const merchantList = (merchants as string[]).map((m, i) => `${i}|${m}`).join('\n');

    const prompt = `You are a personal finance transaction categoriser.

Available tag IDs: ${tagIds}

For each line below (format: INDEX|MERCHANT_NAME), respond with a JSON object where keys are the INDEX numbers and values have "tag" (pick from the tag IDs above) and "category" ("income" or "expense").

${merchantList}

Rules:
- Use "income" only for salary, wages, benefits, refunds, cashback, investment returns
- Use "expense" for everything else (shopping, food, bills, subscriptions, transfers out)
- Pick the most specific tag that fits; use "other" only if nothing fits
- Respond ONLY with raw JSON, no markdown, no explanation

Example response: {"0":{"tag":"food","category":"expense"},"1":{"tag":"salary","category":"income"}}`;

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

    // Parse index-keyed response and remap to merchant names
    let indexed: Record<string, { tag: string; category: string }> = {};
    try {
      indexed = JSON.parse(text);
    } catch {
      console.error('[import/categorise] Failed to parse Grok response:', text.slice(0, 300));
    }

    // Convert {"0": {tag, category}, "1": ...} → {"MERCHANT_NAME": {tag, category}}
    const result: Record<string, { tag: string; category: string }> = {};
    for (const [idx, val] of Object.entries(indexed)) {
      const merchant = (merchants as string[])[Number(idx)];
      if (merchant && val?.tag) result[merchant] = val;
    }

    return NextResponse.json({ categorisations: result });
  } catch (error) {
    console.error('[import/categorise] unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
