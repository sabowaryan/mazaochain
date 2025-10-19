# Analyse: Patterns Utiles du HederaWalletProvider

## Contexte

L'exemple fourni utilise **WalletKit** (pour créer un wallet) alors que nous utilisons **AppKit** (pour se connecter à un wallet). Cependant, plusieurs patterns sont très utiles.

## Patterns Utiles pour Notre Implémentation

### 1. ✅ Gestion des Event Listeners WalletConnect

**Dans l'exemple:**
```typescript
useEffect(() => {
  if (!walletkit.current) return

  // Session proposal
  walletkit.current.on('session_proposal', onSessionProposal)
  
  // Session request
  walletkit.current.on('session_request', onSessionRequest)
  
  // Session ping
  walletkit.current.engine.signClient.events.on('session_ping', (data) =>
    console.log('ping', data)
  )
  
  // Session delete
  walletkit.current.on('session_delete', (data) => {
    console.log('session_delete event received', data)
  })
  
  // Pairing delete
  walletkit.current.core.pairing.events.on('pairing_delete', (pairing) => {
    console.log(`Pairing deleted by dapp!`)
  })
}, [eip155Wallet, hip820Wallet, network, isInitialized])
```

**Application pour nous:**
```typescript
// Dans AppKitWalletService ou HederaWalletService
private setupEventListeners(): void {
  if (!this.appKitInstance) return

  // Écouter les changements de compte
  this.appKitInstance.on('accountsChanged', (accounts: string[]) => {
    console.log('Accounts changed:', accounts)
    this.handleAccountChange(accounts)
  })

  // Écouter les changements de réseau
  this.appKitInstance.on('chainChanged', (chainId: string) => {
    console.log('Chain changed:', chainId)
    this.handleChainChange(chainId)
  })

  // Écouter les déconnexions
  this.appKitInstance.on('disconnect', () => {
    console.log('Wallet disconnected')
    this.connectionState = null
  })

  // Écouter les mises à jour de session
  this.appKitInstance.on('session_update', (data: any) => {
    console.log('Session updated:', data)
    this.updateConnectionStateFromAppKit(data)
  })

  // Écouter les suppressions de session
  this.appKitInstance.on('session_delete', (data: any) => {
    console.log('Session deleted:', data)
    this.connectionState = null
  })
}
```

### 2. ✅ Support Multi-Namespace (EIP155 + Hedera)

**Dans l'exemple:**
```typescript
// Support à la fois EIP155 (EVM) et Hedera (Native)
const eip155Wallet = EIP155Wallet.init({ privateKey: ecdsaPrivateKey })
const hip820Wallet = HIP820Wallet.init({
  chainId: `hedera:${network}`,
  accountId: ed25519AccountId,
  privateKey: hip820PrivateKey,
})

// Lors de la session proposal
if (selectedAccount.namespace === 'eip155') {
  supportedNamespaces.eip155 = {
    chains: [eip155Network.caipNetworkId],
    methods: Object.values(Eip155JsonRpcMethod),
    events,
    accounts: [`${eip155Network.caipNetworkId}:${selectedAccount.address}`],
  }
} else if (selectedAccount.namespace === 'hedera') {
  supportedNamespaces.hedera = {
    chains: hip820Chains,
    methods: Object.values(HederaJsonRpcMethod),
    events,
    accounts: hip820Chains.map((chain) => `${chain}:${selectedAccount.id}`),
  }
}
```

**Application pour nous:**
```typescript
// Dans notre HederaWalletService
async connectWallet(namespace: "hedera" | "eip155" = "hedera"): Promise<WalletConnection> {
  // Sélectionner l'adapter approprié
  const adapter = namespace === "hedera" 
    ? this.nativeAdapter  // Pour les transactions Hedera natives
    : this.evmAdapter;    // Pour les transactions EVM

  // Connecter avec le namespace approprié
  await adapter.connect({
    chains: namespace === "hedera" 
      ? [HederaChainDefinition.Native.Testnet]
      : [HederaChainDefinition.EVM.Testnet]
  })
}
```

### 3. ✅ Modal de Sélection de Compte

**Dans l'exemple:**
```typescript
// Préparer les comptes disponibles
const availableAccounts = []

// ECDSA pour EIP155
if (ecdsaAccountId && eip155Wallet) {
  availableAccounts.push({
    id: ecdsaAccountId,
    address: eip155Wallet.getEvmAddress(),
    type: 'ECDSA',
    namespace: 'eip155',
  })
}

// Ed25519 pour Hedera
if (ed25519AccountId && hip820Wallet) {
  availableAccounts.push({
    id: ed25519AccountId,
    address: ed25519EvmAddress || '',
    type: 'Ed25519',
    namespace: 'hedera',
  })
}

// Afficher le modal de sélection
showModal(
  'Connect Account',
  <AccountSelectionModal
    accounts={availableAccounts}
    onSelectAccount={handleSelectAccount}
    onCancel={handleReject}
    dappName={dappMetadata?.name}
    dappUrl={dappMetadata?.url}
  />,
  'info'
)
```

**Application pour nous:**
```typescript
// Créer un composant NamespaceSelector
export function NamespaceSelector({ onSelect }: { onSelect: (ns: string) => void }) {
  return (
    <div className="space-y-4">
      <h3>Choisir le type de connexion</h3>
      
      <button onClick={() => onSelect('hedera')}>
        <div>
          <strong>Hedera Native</strong>
          <p>Pour les transactions Hedera (HBAR, tokens HTS)</p>
        </div>
      </button>
      
      <button onClick={() => onSelect('eip155')}>
        <div>
          <strong>Hedera EVM</strong>
          <p>Pour les smart contracts EVM sur Hedera</p>
        </div>
      </button>
    </div>
  )
}
```

### 4. ✅ Gestion du Verrouillage/Déverrouillage

**Dans l'exemple:**
```typescript
const [isLocked, setIsLocked] = useState(true)
const [hasStoredCredentials, setHasStoredCredentials] = useState(false)

// Sauvegarder les credentials chiffrés
if (password) {
  const walletData = {
    ecdsaAccountId,
    ecdsaPrivateKey,
    ed25519AccountId,
    ed25519PrivateKey,
    network,
    projectId,
  }
  const encryptedData = await CryptoUtils.encrypt(
    JSON.stringify(walletData), 
    password
  )
  localStorage.setItem('encryptedWalletData', encryptedData)
}

// Déverrouiller
const unlock = async (password: string): Promise<boolean> => {
  const encryptedData = localStorage.getItem('encryptedWalletData')
  const decryptedData = await CryptoUtils.decrypt(encryptedData, password)
  const walletData = JSON.parse(decryptedData)
  await initialize(...)
  return true
}
```

**Application pour nous:**
```typescript
// Sauvegarder la session WalletConnect (pas les clés privées!)
async saveSession(session: WalletConnection): Promise<void> {
  try {
    const sessionData = {
      accountId: session.accountId,
      network: session.network,
      namespace: session.namespace,
      chainId: session.chainId,
      timestamp: Date.now(),
    }
    
    localStorage.setItem('wallet_session', JSON.stringify(sessionData))
  } catch (error) {
    console.error('Failed to save session:', error)
  }
}

// Restaurer la session
async restoreSession(): Promise<WalletConnection | null> {
  try {
    const sessionData = localStorage.getItem('wallet_session')
    if (!sessionData) return null
    
    const session = JSON.parse(sessionData)
    
    // Vérifier que la session n'est pas expirée (24h)
    const isExpired = Date.now() - session.timestamp > 24 * 60 * 60 * 1000
    if (isExpired) {
      localStorage.removeItem('wallet_session')
      return null
    }
    
    return session
  } catch (error) {
    console.error('Failed to restore session:', error)
    return null
  }
}
```

### 5. ✅ Gestion des Requêtes de Transaction

**Dans l'exemple:**
```typescript
const onSessionRequest = async (requestEvent) => {
  const method = params.request.method
  const isEIP155Method = Object.values(Eip155JsonRpcMethod).includes(method)

  const processRequest = async (isConfirm: boolean) => {
    let response: JsonRpcResult<string> | JsonRpcError
    
    if (isConfirm) {
      response = isEIP155Method
        ? await eip155Wallet.approveSessionRequest(requestEvent)
        : await hip820Wallet.approveSessionRequest(requestEvent)
    } else {
      response = isEIP155Method
        ? eip155Wallet.rejectSessionRequest(requestEvent)
        : hip820Wallet.rejectSessionRequest(requestEvent)
    }

    await walletkit.current.respondSessionRequest({
      topic,
      response,
    })
  }

  showModal(
    'Transaction Request',
    <PayloadDisplay payload={requestEvent} />,
    'confirm',
    handleApproveRequest,
    handleRejectRequest
  )
}
```

**Application pour nous:**
```typescript
// Dans HederaWalletService
async signTransaction(transaction: Transaction): Promise<Transaction> {
  if (!this.hederaProvider) {
    throw new WalletError(
      WalletErrorCode.NOT_CONNECTED,
      "Wallet not connected"
    )
  }

  try {
    // Déterminer le namespace actif
    const namespace = this.connectionState?.namespace || 'hedera'
    
    // Signer selon le namespace
    if (namespace === 'hedera') {
      // Utiliser HIP820 pour les transactions natives
      const signedTx = await this.nativeAdapter.signTransaction(transaction)
      return signedTx
    } else {
      // Utiliser EIP155 pour les transactions EVM
      const signedTx = await this.evmAdapter.signTransaction(transaction)
      return signedTx
    }
  } catch (error) {
    console.error('Transaction signing failed:', error)
    throw new WalletError(
      WalletErrorCode.TRANSACTION_REJECTED,
      "Transaction was rejected by user"
    )
  }
}
```

### 6. ✅ Système de Modal Réutilisable

**Dans l'exemple:**
```typescript
const [modal, setModal] = useState({
  isOpen: false,
  title: '',
  content: null,
  type: 'info',
  onConfirm: undefined,
  onReject: undefined,
  hideButtons: false,
})

const showModal = (
  title: string,
  content: any,
  type: 'confirm' | 'error' | 'info' = 'info',
  onConfirm?: () => void,
  onReject?: () => void,
  hideButtons?: boolean,
) => {
  setModal({
    isOpen: true,
    title,
    content,
    type,
    onConfirm,
    onReject,
    hideButtons,
  })
}
```

**Application pour nous:**
```typescript
// Créer un hook useWalletModal
export function useWalletModal() {
  const [modal, setModal] = useState<{
    isOpen: boolean
    title: string
    content: React.ReactNode
    type: 'confirm' | 'error' | 'info' | 'success'
    onConfirm?: () => void
    onReject?: () => void
  }>({
    isOpen: false,
    title: '',
    content: null,
    type: 'info',
  })

  const showTransactionConfirm = (
    transaction: Transaction,
    onConfirm: () => void,
    onReject: () => void
  ) => {
    setModal({
      isOpen: true,
      title: 'Confirmer la transaction',
      content: <TransactionDetails transaction={transaction} />,
      type: 'confirm',
      onConfirm,
      onReject,
    })
  }

  const showError = (message: string) => {
    setModal({
      isOpen: true,
      title: 'Erreur',
      content: <p>{message}</p>,
      type: 'error',
    })
  }

  const showSuccess = (message: string) => {
    setModal({
      isOpen: true,
      title: 'Succès',
      content: <p>{message}</p>,
      type: 'success',
    })
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  return {
    modal,
    showTransactionConfirm,
    showError,
    showSuccess,
    closeModal,
  }
}
```

## Patterns NON Applicables

### ❌ WalletKit vs AppKit

**L'exemple utilise WalletKit** (pour créer un wallet qui reçoit des connexions)  
**Nous utilisons AppKit** (pour se connecter à un wallet existant)

```typescript
// ❌ Ne PAS utiliser
const walletkit = await WalletKit.init({...})

// ✅ Utiliser à la place
const appkit = await createAppKit({...})
```

### ❌ Gestion des Clés Privées

**L'exemple stocke les clés privées** (car c'est un wallet)  
**Nous ne stockons JAMAIS les clés** (car nous nous connectons à HashPack)

```typescript
// ❌ Ne JAMAIS faire
localStorage.setItem('privateKey', privateKey) // DANGER!

// ✅ Faire à la place
localStorage.setItem('wallet_session', JSON.stringify({
  accountId: '0.0.1234567',
  network: 'testnet',
  // Pas de clés privées!
}))
```

## Recommandations d'Implémentation

### 1. Améliorer la Gestion des Événements

```typescript
// Dans HederaWalletService
private setupSessionListeners(): void {
  if (!this.hederaProvider) return

  // Changement de compte
  this.hederaProvider.on('accountsChanged', (accounts: string[]) => {
    if (accounts && accounts.length > 0) {
      this.updateConnectionStateFromAccount(accounts[0])
    } else {
      this.connectionState = null
    }
  })

  // Changement de réseau
  this.hederaProvider.on('chainChanged', (chainId: string) => {
    if (this.connectionState) {
      this.connectionState.chainId = chainId
      this.connectionState.network = chainId.includes('mainnet') 
        ? 'mainnet' 
        : 'testnet'
    }
  })

  // Déconnexion
  this.hederaProvider.on('disconnect', () => {
    console.log('Wallet disconnected by user')
    this.connectionState = null
  })

  // Mise à jour de session
  this.hederaProvider.on('session_update', (data: any) => {
    console.log('Session updated:', data)
    // Mettre à jour l'état si nécessaire
  })

  // Suppression de session
  this.hederaProvider.on('session_delete', (data: any) => {
    console.log('Session deleted:', data)
    this.connectionState = null
  })
}
```

### 2. Ajouter un Sélecteur de Namespace

```typescript
// Créer un composant pour choisir entre Native et EVM
export function NamespaceSelector({ 
  onSelect 
}: { 
  onSelect: (namespace: 'hedera' | 'eip155') => void 
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => onSelect('hedera')}
        className="p-4 border rounded-lg hover:bg-gray-50"
      >
        <h3 className="font-semibold">Hedera Native</h3>
        <p className="text-sm text-gray-600">
          Transactions HBAR et tokens HTS
        </p>
      </button>

      <button
        onClick={() => onSelect('eip155')}
        className="p-4 border rounded-lg hover:bg-gray-50"
      >
        <h3 className="font-semibold">Hedera EVM</h3>
        <p className="text-sm text-gray-600">
          Smart contracts Solidity
        </p>
      </button>
    </div>
  )
}
```

### 3. Améliorer la Persistance de Session

```typescript
// Dans HederaWalletService
async saveSession(): Promise<void> {
  if (!this.connectionState) return

  try {
    const sessionData = {
      accountId: this.connectionState.accountId,
      network: this.connectionState.network,
      namespace: this.connectionState.namespace,
      chainId: this.connectionState.chainId,
      timestamp: Date.now(),
    }

    localStorage.setItem('hedera_wallet_session', JSON.stringify(sessionData))
  } catch (error) {
    console.error('Failed to save session:', error)
  }
}

async restoreSession(): Promise<WalletConnection | null> {
  try {
    const sessionData = localStorage.getItem('hedera_wallet_session')
    if (!sessionData) return null

    const session = JSON.parse(sessionData)

    // Vérifier l'expiration (24h)
    const age = Date.now() - session.timestamp
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('hedera_wallet_session')
      return null
    }

    // Tenter de restaurer la connexion
    const accounts = this.hederaProvider?.getAccountAddresses()
    if (accounts && accounts.length > 0) {
      return session
    }

    return null
  } catch (error) {
    console.error('Failed to restore session:', error)
    return null
  }
}
```

## Conclusion

### ✅ Patterns Utiles

1. **Event Listeners** - Écouter les changements de compte/réseau
2. **Multi-Namespace** - Support Hedera Native + EVM
3. **Modal System** - Système de modal réutilisable
4. **Session Persistence** - Sauvegarder/restaurer les sessions
5. **Error Handling** - Gestion robuste des erreurs

### ❌ Patterns Non Applicables

1. **WalletKit** - Nous utilisons AppKit
2. **Private Keys** - Nous ne stockons jamais les clés
3. **Wallet Creation** - Nous nous connectons à HashPack

### 🎯 Prochaines Étapes

1. Implémenter les event listeners améliorés
2. Ajouter le sélecteur de namespace
3. Améliorer la persistance de session
4. Créer un système de modal réutilisable
5. Tester avec les deux namespaces (Native + EVM)

---

**Cet exemple est une excellente référence pour améliorer notre implémentation!**

