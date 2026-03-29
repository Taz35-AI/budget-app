import { NextRequest, NextResponse } from 'next/server';

const GRANTED = 'granted';

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const correct = process.env.PREVIEW_PASSWORD?.trim();

  if (!correct || password?.trim() !== correct) {
    // Slow down brute force attempts
    await new Promise((r) => setTimeout(r, 1500));
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('preview_access', GRANTED, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
