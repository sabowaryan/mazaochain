import { NextRequest, NextResponse } from 'next/server';

const MIRROR_NODE_BASE =
  process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet'
    ? 'https://mainnet.mirrornode.hedera.com/api/v1'
    : 'https://testnet.mirrornode.hedera.com/api/v1';

export interface MirrorNodeTokenInfo {
  token_id: string;
  name: string;
  symbol: string;
  decimals: string;
  total_supply: string;
  treasury_account_id: string;
  type: string;
  created_timestamp: string;
  memo: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');

  if (!tokenId) {
    return NextResponse.json({ error: 'tokenId query param required' }, { status: 400 });
  }

  try {
    const url = `${MIRROR_NODE_BASE}/tokens/${encodeURIComponent(tokenId)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Mirror Node returned ${res.status}` },
        { status: res.status }
      );
    }

    const data: MirrorNodeTokenInfo = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mirror-node/token-details] fetch error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
