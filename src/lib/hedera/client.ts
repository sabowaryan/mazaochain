import { Client, PrivateKey, AccountId } from '@hashgraph/sdk'
import { env } from '../config/env'

let client: Client | null = null

export function getHederaClient(): Client {
  if (!client) {
    const network = env.NEXT_PUBLIC_HEDERA_NETWORK as 'testnet' | 'mainnet'
    
    if (network === 'testnet') {
      client = Client.forTestnet()
    } else {
      client = Client.forMainnet()
    }

    // Set operator account (for server-side operations)
    if (env.HEDERA_PRIVATE_KEY && env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID) {
      try {
        const operatorKey = PrivateKey.fromString(env.HEDERA_PRIVATE_KEY)
        const operatorId = AccountId.fromString(env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID)
        
        client.setOperator(operatorId, operatorKey)
      } catch (error) {
        console.warn('Failed to set Hedera operator:', error)
        // Continue without operator for build-time compatibility
      }
    }
  }

  return client
}

export function closeHederaClient(): void {
  if (client) {
    client.close()
    client = null
  }
}