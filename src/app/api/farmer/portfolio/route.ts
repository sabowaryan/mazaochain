import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export interface PortfolioToken {
  tokenId: string;
  cropType: string;
  amount: number;
  estimatedValue: number;
  harvestDate: string;
  status: 'active' | 'harvested' | 'expired';
  evaluationId: string;
  tokenName?: string;
  tokenSymbol?: string;
  transferredToFarmer?: boolean;
  mirrorNodeBalance?: number;
}

const MIRROR_NODE_BASE =
  process.env.NEXT_PUBLIC_HEDERA_NETWORK === 'mainnet'
    ? 'https://mainnet.mirrornode.hedera.com/api/v1'
    : 'https://testnet.mirrornode.hedera.com/api/v1';

async function fetchMirrorNodeTokenInfo(
  tokenId: string
): Promise<{ name: string; symbol: string; total_supply: string; decimals: string } | null> {
  try {
    const res = await fetch(`${MIRROR_NODE_BASE}/tokens/${encodeURIComponent(tokenId)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchFarmerTokenBalance(
  farmerAccountId: string,
  tokenId: string
): Promise<number> {
  try {
    const res = await fetch(
      `${MIRROR_NODE_BASE}/accounts/${encodeURIComponent(farmerAccountId)}/tokens?token.id=${encodeURIComponent(tokenId)}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 30 } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const tokens: { balance: number }[] = data?.tokens ?? [];
    return tokens[0]?.balance ?? 0;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId') ?? userId;

    const callerProfile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { role: true, wallet_address: true },
    });

    if (farmerId !== userId && callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const farmerProfile = await prisma.profile.findUnique({
      where: { id: farmerId },
      select: { wallet_address: true },
    });

    const records = await prisma.tokenizationRecord.findMany({
      where: {
        evaluation: { farmer_id: farmerId },
        status: 'completed',
        token_id: { not: null },
      },
      include: {
        evaluation: {
          select: {
            id: true,
            crop_type: true,
            valeur_estimee: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const daysUntilHarvest = (cropType: string) => (cropType === 'cafe' ? 90 : 120);
    const farmerWalletAddress = farmerProfile?.wallet_address ?? null;

    // Enrich each record with Mirror Node token metadata
    const tokens: PortfolioToken[] = await Promise.all(
      records.map(async (record) => {
        const evaluation = record.evaluation;
        const harvestDate = new Date(evaluation.created_at);
        harvestDate.setDate(harvestDate.getDate() + daysUntilHarvest(evaluation.crop_type));

        const now = new Date();
        const status: PortfolioToken['status'] = harvestDate < now ? 'harvested' : 'active';
        const estimatedValue = evaluation.valeur_estimee ?? 0;
        const tokenId = record.token_id!;

        // Fetch real token metadata from Mirror Node
        const [mirrorInfo, mirrorBalanceBaseUnits] = await Promise.all([
          fetchMirrorNodeTokenInfo(tokenId),
          farmerWalletAddress
            ? fetchFarmerTokenBalance(farmerWalletAddress, tokenId)
            : Promise.resolve(0),
        ]);

        // Normalize from Mirror Node base units to human-readable token units
        const decimals = mirrorInfo?.decimals ? Number(mirrorInfo.decimals) : 2;
        const mirrorBalance = mirrorBalanceBaseUnits / Math.pow(10, decimals);

        return {
          tokenId,
          cropType: evaluation.crop_type,
          amount: mirrorBalance,
          estimatedValue,
          harvestDate: harvestDate.toISOString(),
          status,
          evaluationId: evaluation.id,
          tokenName: mirrorInfo?.name ?? `MAZAO-${evaluation.crop_type.toUpperCase()}`,
          tokenSymbol: mirrorInfo?.symbol ?? `MAZAO`,
          transferredToFarmer: mirrorBalance > 0,
          mirrorNodeBalance: mirrorBalance,
        };
      })
    );

    const totalValue = tokens.reduce((sum, t) => sum + t.estimatedValue, 0);
    const totalAmount = tokens.reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      data: tokens,
      totalValue,
      totalAmount,
      tokenCount: tokens.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[farmer/portfolio] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
