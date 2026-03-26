// Server-side only: HTS fungible token creation using the operator account
// Never import this from client components

export interface CropTokenCreationResult {
  success: boolean;
  tokenId?: string;
  transactionId?: string;
  transferredToFarmer?: boolean;
  error?: string;
}

/**
 * @param params.quantity — evaluated crop quantity (superficie × rendement_historique).
 *   Each whole unit = 1.00 token (2 decimal places), so initialSupply = round(quantity × 100).
 *   This represents the actual physical crop volume, not the monetary value.
 */
export async function createCropToken(params: {
  cropType: string;
  farmerWalletAddress: string;
  quantity: number;
  tokenSymbol: string;
}): Promise<CropTokenCreationResult> {
  const operatorAccountId = process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!operatorAccountId || !privateKey) {
    return {
      success: false,
      error:
        'Hedera operator credentials not configured (HEDERA_PRIVATE_KEY / NEXT_PUBLIC_HEDERA_ACCOUNT_ID)',
    };
  }

  try {
    const {
      TokenCreateTransaction,
      TokenType,
      TokenSupplyType,
      AccountId,
      TransferTransaction,
    } = await import('@hashgraph/sdk');

    const { getHederaClient } = await import('@/lib/hedera/client');
    const client = getHederaClient();

    const tokenName = `MAZAO-${params.cropType.toUpperCase()}`;
    const symbol = params.tokenSymbol.substring(0, 10);
    // initialSupply = quantity × 100 (2 decimal places represent fractional units)
    const initialSupply = Math.max(1, Math.round(params.quantity * 100));
    const treasuryId = AccountId.fromString(operatorAccountId);

    // Step 1: Create the HTS fungible token (treasury = operator)
    const createTx = await new TokenCreateTransaction()
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

    const createReceipt = await createTx.getReceipt(client);

    if (!createReceipt.tokenId) {
      return { success: false, error: 'Token creation succeeded but receipt has no tokenId' };
    }

    const tokenId = createReceipt.tokenId;
    const tokenIdStr = tokenId.toString();
    const createTxId = createTx.transactionId.toString();

    // Step 2: Attempt to transfer tokens to farmer's wallet.
    // This succeeds when the farmer's account has auto-association enabled (common on testnet)
    // or has already associated with this token. If not, the token stays with the operator
    // as custodian until the farmer signs a TokenAssociateTransaction via their wallet.
    let transferredToFarmer = false;
    try {
      const farmerAccountId = AccountId.fromString(params.farmerWalletAddress);
      const transferTx = await new TransferTransaction()
        .addTokenTransfer(tokenId, treasuryId, -initialSupply)
        .addTokenTransfer(tokenId, farmerAccountId, initialSupply)
        .execute(client);

      const transferReceipt = await transferTx.getReceipt(client);
      transferredToFarmer = transferReceipt.status.toString() === 'SUCCESS';
    } catch (transferError) {
      // TOKEN_NOT_ASSOCIATED_TO_ACCOUNT or similar — farmer must associate via wallet first.
      // The token remains with the operator; farmer sees it via tokenization records in DB.
      const msg =
        transferError instanceof Error ? transferError.message : String(transferError);
      console.warn(
        `[hedera-token-server] Transfer to farmer failed (${msg}). Token ${tokenIdStr} held by operator.`
      );
    }

    return {
      success: true,
      tokenId: tokenIdStr,
      transactionId: createTxId,
      transferredToFarmer,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[hedera-token-server] createCropToken error:', message);
    return { success: false, error: message };
  }
}
