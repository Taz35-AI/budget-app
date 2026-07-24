import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import OpenAI from 'openai';

/** Largest merchant list accepted in one call — keeps the prompt bounded. */
const MAX_MERCHANTS = 300;
const MAX_MERCHANT_LEN = 120;

// POST /api/import/categorise
// Body: { merchants: string[], tags: { id: string; label: string; category: 'income'|'expense'|'both' }[] }
// Returns: { [merchant: string]: { tag: string; category: 'income'|'expense' } }
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ error: 'AI categorisation is not configured' }, { status: 503 });
    }

    // 20 calls/hour — a large import batches into a handful of calls.
    const limit = rateLimit(`categorise:${ctx.userId}`, 20, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many categorisation requests. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
      );
    }

    const body = await req.json().catch(() => null);
    const rawMerchants = body?.merchants;
    const rawTags = body?.tags;

    if (!Array.isArray(rawMerchants) || rawMerchants.length === 0) {
      return NextResponse.json({ error: 'merchants array required' }, { status: 400 });
    }
    if (rawMerchants.length > MAX_MERCHANTS) {
      return NextResponse.json(
        { error: `Too many merchants — send at most ${MAX_MERCHANTS} per request` },
        { status: 400 },
      );
    }

    const merchants = rawMerchants
      .filter((m: unknown): m is string => typeof m === 'string' && m.trim().length > 0)
      .map((m: string) => m.trim().slice(0, MAX_MERCHANT_LEN));

    if (merchants.length === 0) {
      return NextResponse.json({ error: 'merchants array required' }, { status: 400 });
    }

    const tagIds = (Array.isArray(rawTags) ? rawTags : [])
      .map((t: unknown) => (t as { id?: unknown })?.id)
      .filter((id: unknown): id is string => typeof id === 'string')
      .slice(0, 100)
      .join(', ');

    // Instantiate lazily so the build doesn't fail when XAI_API_KEY is absent
    const client = new OpenAI({
      apiKey: process.env.XAI_API_KEY,
      baseURL: 'https://api.x.ai/v1',
    });

    // Use index-based response to avoid key-matching issues with long merchant names
    const merchantList = merchants.map((m, i) => `${i}|${m}`).join('\n');

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
      const merchant = merchants[Number(idx)];
      if (!merchant || typeof val?.tag !== 'string') continue;
      result[merchant] = {
        tag: val.tag,
        category: val.category === 'income' ? 'income' : 'expense',
      };
    }

    return NextResponse.json({ categorisations: result });
  } catch (error) {
    console.error('[import/categorise] unexpected error:', error);
    return NextResponse.json({ error: 'Failed to categorise transactions' }, { status: 500 });
  }
}
