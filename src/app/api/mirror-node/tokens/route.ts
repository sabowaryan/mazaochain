import { NextRequest, NextResponse } from 'next/server';

const MIRROR_NODE_BASE =
  process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet'
    ? 'https://mainnet.mirrornode.hedera.com/api/v1'
    : 'https://testnet.mirrornode.hedera.com/api/v1';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('accountId');

  if (!accountId) {
    return NextResponse.json({ error: 'accountId query param required' }, { status: 400 });
  }

  try {
    const url = `${MIRROR_NODE_BASE}/accounts/${encodeURIComponent(accountId)}/tokens?limit=100&order=desc`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[mirror-node/tokens] upstream error:', res.status, text);
      return NextResponse.json(
        { error: `Mirror Node returned ${res.status}`, tokens: [] },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mirror-node/tokens] fetch error:', message);
    return NextResponse.json({ error: message, tokens: [] }, { status: 500 });
  }
}
