// Server-side only: HTS fungible token creation using the operator account
// Never import this from client components

export interface CropTokenCreationResult {
  success: boolean;
  tokenId?: string;
  transactionId?: string;
  error?: string;
}

export async function createCropToken(params: {
  cropType: string;
  farmerWalletAddress: string;
  estimatedValue: number;
  tokenSymbol: string;
}): Promise<CropTokenCreationResult> {
  const accountId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    return {
      success: false,
      error: 'Hedera operator credentials not configured (HEDERA_PRIVATE_KEY / NEXT_PUBLIC_HEDERA_ACCOUNT_ID)',
    };
  }

  try {
    const {
      TokenCreateTransaction,
      TokenType,
      TokenSupplyType,
      AccountId,
    } = await import('@hashgraph/sdk');

    const { getHederaClient } = await import('@/lib/hedera/client');
    const client = getHederaClient();

    const tokenName = `MAZAO-${params.cropType.toUpperCase()}`;
    const symbol = params.tokenSymbol.substring(0, 10);
    const initialSupply = Math.max(1, Math.round(params.estimatedValue * 100));
    const treasuryId = AccountId.fromString(accountId);

    const tx = await new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(symbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(2)
      .setInitialSupply(initialSupply)
      .setTreasuryAccountId(treasuryId)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(initialSupply)
      .setMemo(
        `MazaoChain crop token for ${params.cropType} - farmer ${params.farmerWalletAddress}`
      )
      .execute(client);

    const receipt = await tx.getReceipt(client);

    if (!receipt.tokenId) {
      return { success: false, error: 'Token creation succeeded but receipt has no tokenId' };
    }

    return {
      success: true,
      tokenId: receipt.tokenId.toString(),
      transactionId: tx.transactionId.toString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[hedera-token-server] createCropToken error:', message);
    return { success: false, error: message };
  }
}
