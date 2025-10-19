# Design Document

## Overview

Ce document détaille l'approche d'audit et de correction de l'implémentation existante du MVP MazaoChain. L'objectif est de vérifier systématiquement chaque composant, identifier les problèmes d'intégration, corriger les bugs, et compléter les fonctionnalités manquantes sans créer de doublons ou de fichiers inutiles.

## Architecture Existante

### Structure Actuelle du Projet

```
src/
├── app/                          # Pages Next.js 15
│   ├── [lang]/                   # Routes internationalisées
│   │   ├── auth/                 # Authentification
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── dashboard/            # Dashboards par rôle
│   │       ├── farmer/
│   │       ├── cooperative/
│   │       └── lender/
│   ├── api/                      # API Routes
│   │   ├── crop-evaluations/
│   │   ├── farmers/
│   │   ├── loans/
│   │   └── metrics/
│   └── admin/                    # Interface admin
├── components/                   # Composants React
│   ├── auth/                     # Authentification
│   ├── wallet/                   # HashPack wallet
│   ├── crop-evaluation/          # Évaluation des cultures
│   ├── loan/                     # Gestion des prêts
│   ├── cooperative/              # Interface coopérative
│   ├── lender/                   # Interface prêteur
│   ├── notifications/            # Système de notifications
│   └── ui/                       # Composants UI réutilisables
├── contexts/                     # React Contexts
│   └── AuthContext.tsx
├── hooks/                        # Custom hooks
│   ├── useAuth.ts
│   ├── useWallet.ts
│   ├── useMazaoContracts.ts
│   └── useNotifications.ts
├── lib/                          # Bibliothèques et utilitaires
│   ├── auth/
│   ├── blockchain/
│   ├── contracts/
│   ├── hedera/
│   ├── supabase/
│   └── wallet/
└── types/                        # Définitions TypeScript
```

## Méthodologie d'Audit

### Phase 1: Audit de l'Authentification et des Rôles

#### Fichiers à Vérifier
```typescript
// Fichiers critiques pour l'authentification
- src/contexts/AuthContext.tsx
- src/hooks/useAuth.ts
- src/middleware.ts
- src/lib/auth/
- src/components/auth/
```

#### Points de Vérification

1. **Cohérence du Context Auth**
   - Vérifier que AuthContext fournit toutes les méthodes nécessaires
   - S'assurer que le context est accessible dans tous les composants
   - Valider la gestion des sessions Supabase

2. **Middleware de Protection des Routes**
   - Vérifier que toutes les routes dashboard sont protégées
   - Confirmer que les redirections fonctionnent correctement
   - Tester les cas edge (session expirée, token invalide)

3. **Composants d'Authentification**
   - LoginForm: validation, gestion d'erreurs, redirection
   - RegisterForm: sélection de rôle, validation email, création de profil
   - AuthGuard: vérification des rôles, affichage conditionnel

4. **Corrections à Appliquer**
   ```typescript
   // Si le middleware ne vérifie pas correctement les rôles
   // Modifier src/middleware.ts pour ajouter:
   
   export async function middleware(request: NextRequest) {
     const { user, role } = await getAuthUser(request);
     
     // Vérifier que l'utilisateur a le bon rôle pour la route
     if (request.nextUrl.pathname.startsWith('/dashboard/farmer')) {
       if (role !== 'agriculteur') {
         return NextResponse.redirect(new URL('/unauthorized', request.url));
       }
     }
     // ... autres vérifications
   }
   ```

### Phase 2: Audit de l'Intégration HashPack Wallet

#### Fichiers à Vérifier
```typescript
- src/hooks/useWallet.ts
- src/components/wallet/WalletConnection.tsx
- src/components/wallet/WalletBalance.tsx
- src/lib/wallet/hedera-wallet.ts
```

#### Points de Vérification

1. **Hook useWallet**
   - Vérifier la gestion des états (connected, connecting, error)
   - Confirmer que les méthodes connect/disconnect fonctionnent
   - Valider la persistance de la connexion

2. **Composants Wallet**
   - WalletConnection: affichage du statut, boutons connect/disconnect
   - WalletBalance: affichage des balances USDC et MazaoTokens
   - Gestion des erreurs de connexion

3. **Intégration dans les Pages**
   - Vérifier que le wallet est accessible dans tous les dashboards
   - Confirmer que les transactions utilisent le wallet connecté
   - Tester les cas où le wallet n'est pas connecté

4. **Corrections à Appliquer**
   ```typescript
   // Si WalletBalance ne rafraîchit pas automatiquement
   // Modifier src/components/wallet/WalletBalance.tsx:
   
   export function WalletBalance() {
     const { accountId, isConnected } = useWallet();
     const [balances, setBalances] = useState({ usdc: 0, mazao: 0 });
     
     useEffect(() => {
       if (isConnected && accountId) {
         const interval = setInterval(async () => {
           const newBalances = await fetchBalances(accountId);
           setBalances(newBalances);
         }, 10000); // Rafraîchir toutes les 10 secondes
         
         return () => clearInterval(interval);
       }
     }, [isConnected, accountId]);
     
     // ... reste du composant
   }
   ```

### Phase 3: Audit des Pages et Interfaces

#### Structure des Dashboards à Vérifier

```typescript
// Dashboard Agriculteur
src/app/[lang]/dashboard/farmer/
├── page.tsx                    # Vue d'ensemble
├── evaluations/
│   ├── page.tsx               # Liste des évaluations
│   ├── new/page.tsx           # Nouvelle évaluation
│   └── [id]/page.tsx          # Détails d'une évaluation
├── loans/
│   ├── page.tsx               # Liste des prêts
│   ├── request/page.tsx       # Demande de prêt
│   └── [id]/page.tsx          # Détails d'un prêt
└── portfolio/
    └── page.tsx               # Portfolio de tokens

// Dashboard Coopérative
src/app/[lang]/dashboard/cooperative/
├── page.tsx                    # Vue d'ensemble
├── farmers/
│   ├── page.tsx               # Agriculteurs en attente
│   └── [id]/page.tsx          # Détails agriculteur
├── evaluations/
│   └── page.tsx               # Évaluations à approuver
└── loans/
    └── page.tsx               # Prêts à approuver

// Dashboard Prêteur
src/app/[lang]/dashboard/lender/
├── page.tsx                    # Vue d'ensemble
├── opportunities/
│   └── page.tsx               # Opportunités de prêt
└── portfolio/
    └── page.tsx               # Portfolio d'investissements
```

#### Points de Vérification

1. **Existence des Pages**
   - Vérifier que toutes les pages listées existent
   - Confirmer que les routes sont accessibles
   - Tester la navigation entre les pages

2. **Intégration des Composants**
   - Vérifier que chaque page utilise les bons composants
   - Confirmer que les données sont chargées correctement
   - Valider l'affichage des états de chargement et d'erreur

3. **Responsive Design**
   - Tester chaque page sur mobile (320px, 375px, 768px)
   - Vérifier que les tableaux sont scrollables
   - Confirmer que les formulaires sont utilisables sur mobile

4. **Corrections à Appliquer**
   ```typescript
   // Si une page manque, la créer en utilisant les composants existants
   // Exemple: src/app/[lang]/dashboard/farmer/portfolio/page.tsx
   
   import { FarmerProtection } from '@/components/auth/RouteProtection';
   import { WalletBalance } from '@/components/wallet/WalletBalance';
   import { TokenPortfolio } from '@/components/farmer/TokenPortfolio';
   
   export default function FarmerPortfolioPage() {
     return (
       <FarmerProtection>
         <div className="container mx-auto p-4">
           <h1 className="text-2xl font-bold mb-6">Mon Portfolio</h1>
           <WalletBalance />
           <TokenPortfolio />
         </div>
       </FarmerProtection>
     );
   }
   ```

### Phase 4: Audit de l'Intégration Smart Contracts

#### Fichiers à Vérifier
```typescript
- contracts/LoanManager.sol
- contracts/MazaoTokenFactory.sol
- src/hooks/useMazaoContracts.ts
- src/lib/contracts/
- src/types/contracts.ts
```

#### Points de Vérification

1. **Configuration des Contrats**
   - Vérifier que les adresses de contrats sont dans .env
   - Confirmer que les ABIs sont à jour
   - Valider que les contrats sont déployés sur le bon réseau

2. **Hook useMazaoContracts**
   - Vérifier que toutes les fonctions de contrat sont exposées
   - Confirmer que les transactions sont signées correctement
   - Valider la gestion des erreurs blockchain

3. **Intégration dans les Composants**
   - CropEvaluationForm: appel de mintTokens après approbation
   - LoanRequestForm: vérification du collatéral via le contrat
   - LoanRepaymentInterface: libération du collatéral

4. **Corrections à Appliquer**
   ```typescript
   // Si useMazaoContracts ne gère pas les erreurs correctement
   // Modifier src/hooks/useMazaoContracts.ts:
   
   export function useMazaoContracts() {
     const { accountId, signer } = useWallet();
     
     const mintTokens = async (farmerId: string, amount: number) => {
       try {
         if (!signer) throw new Error('Wallet not connected');
         
         const tx = await tokenFactory.mintTokens(farmerId, amount);
         const receipt = await tx.wait();
         
         // Afficher une notification de succès
         toast.success('Tokens créés avec succès');
         
         return receipt;
       } catch (error) {
         // Gérer les erreurs spécifiques
         if (error.code === 'INSUFFICIENT_FUNDS') {
           toast.error('Fonds insuffisants pour la transaction');
         } else {
           toast.error('Erreur lors de la création des tokens');
         }
         throw error;
       }
     };
     
     return { mintTokens, /* autres fonctions */ };
   }
   ```

### Phase 5: Audit du Système d'Évaluation des Cultures

#### Composants à Vérifier
```typescript
- src/components/crop-evaluation/CropEvaluationForm.tsx
- src/components/crop-evaluation/EvaluationHistory.tsx
- src/components/crop-evaluation/EvaluationDetails.tsx
- src/app/api/crop-evaluations/route.ts
```

#### Points de Vérification

1. **Formulaire d'Évaluation**
   - Validation des champs (superficie, rendement, prix)
   - Calcul automatique de la valeur estimée
   - Affichage de la formule de calcul
   - Gestion des erreurs de soumission

2. **Génération de PDF**
   - Vérifier que le PDF contient toutes les informations
   - Confirmer que le PDF est en Lingala/Français
   - Valider que le téléchargement fonctionne

3. **Historique des Évaluations**
   - Affichage de toutes les évaluations passées
   - Filtrage par statut (pending, approved, rejected)
   - Détails de chaque évaluation

4. **Corrections à Appliquer**
   ```typescript
   // Si le calcul n'est pas affiché en temps réel
   // Modifier src/components/crop-evaluation/CropEvaluationForm.tsx:
   
   export function CropEvaluationForm() {
     const [superficie, setSuperficie] = useState(0);
     const [rendement, setRendement] = useState(0);
     const [prix, setPrix] = useState(0);
     
     // Calcul automatique
     const valeurEstimee = useMemo(() => {
       return superficie * rendement * prix;
     }, [superficie, rendement, prix]);
     
     return (
       <form>
         {/* Champs de formulaire */}
         
         <div className="bg-blue-50 p-4 rounded-lg">
           <h3>Calcul de la valeur</h3>
           <p>{superficie} ha × {rendement} kg/ha × {prix} USDC/kg</p>
           <p className="text-2xl font-bold">{valeurEstimee} USDC</p>
         </div>
       </form>
     );
   }
   ```

### Phase 6: Audit du Système de Prêts

#### Composants à Vérifier
```typescript
- src/components/loan/LoanRequestForm.tsx
- src/components/loan/LoanDashboard.tsx
- src/components/loan/LoanRepaymentInterface.tsx
- src/components/cooperative/LoanApprovalList.tsx
- src/app/api/loans/route.ts
```

#### Points de Vérification

1. **Demande de Prêt**
   - Vérification du collatéral disponible (200%)
   - Calcul du montant maximum empruntable
   - Affichage des conditions du prêt
   - Soumission à la coopérative

2. **Approbation par la Coopérative**
   - Liste des demandes en attente
   - Détails de chaque demande (agriculteur, montant, collatéral)
   - Boutons approuver/rejeter
   - Champ pour commentaires

3. **Décaissement Automatique**
   - Transfert USDC après approbation
   - Mise en escrow du collatéral
   - Génération du reçu de transaction
   - Notification à l'agriculteur

4. **Remboursement**
   - Affichage du solde restant
   - Interface de paiement USDC
   - Libération automatique du collatéral
   - Historique des paiements

5. **Corrections à Appliquer**
   ```typescript
   // Si le calcul du collatéral n'est pas correct
   // Modifier src/components/loan/LoanRequestForm.tsx:
   
   export function LoanRequestForm() {
     const { balances } = useWallet();
     const [loanAmount, setLoanAmount] = useState(0);
     
     // Calcul du collatéral requis (200%)
     const collateralRequired = loanAmount * 2;
     const collateralAvailable = balances.mazao;
     const isEligible = collateralAvailable >= collateralRequired;
     
     // Montant maximum empruntable
     const maxLoanAmount = collateralAvailable / 2;
     
     return (
       <form>
         <div>
           <label>Montant souhaité (USDC)</label>
           <input
             type="number"
             value={loanAmount}
             onChange={(e) => setLoanAmount(Number(e.target.value))}
             max={maxLoanAmount}
           />
           <p className="text-sm text-gray-600">
             Maximum: {maxLoanAmount} USDC
           </p>
         </div>
         
         <div className="bg-yellow-50 p-4 rounded">
           <p>Collatéral requis: {collateralRequired} MAZAO</p>
           <p>Collatéral disponible: {collateralAvailable} MAZAO</p>
           {!isEligible && (
             <p className="text-red-600">Collatéral insuffisant</p>
           )}
         </div>
         
         <button disabled={!isEligible}>Demander le prêt</button>
       </form>
     );
   }
   ```

### Phase 7: Audit des Interfaces Coopérative et Prêteur

#### Composants Coopérative à Vérifier
```typescript
- src/components/cooperative/PendingFarmersValidation.tsx
- src/components/cooperative/PendingEvaluationsReview.tsx
- src/components/cooperative/LoanApprovalList.tsx
```

#### Composants Prêteur à Vérifier
```typescript
- src/components/lender/LenderInvestmentDashboard.tsx
- src/components/lender/RiskAssessmentDisplay.tsx
- src/components/lender/LenderPortfolio.tsx
```

#### Points de Vérification

1. **Dashboard Coopérative**
   - Compteurs des demandes en attente
   - Liste des agriculteurs à valider
   - Liste des évaluations à approuver
   - Liste des prêts à approuver

2. **Dashboard Prêteur**
   - Opportunités de prêt disponibles
   - Métriques de risque pour chaque prêt
   - Portfolio d'investissements actifs
   - Historique des rendements

3. **Corrections à Appliquer**
   ```typescript
   // Si le dashboard coopérative ne charge pas les données
   // Modifier src/app/[lang]/dashboard/cooperative/page.tsx:
   
   export default function CooperativeDashboard() {
     const [pendingFarmers, setPendingFarmers] = useState([]);
     const [pendingEvaluations, setPendingEvaluations] = useState([]);
     const [pendingLoans, setPendingLoans] = useState([]);
     const [loading, setLoading] = useState(true);
     
     useEffect(() => {
       async function loadData() {
         try {
           const [farmers, evaluations, loans] = await Promise.all([
             fetch('/api/farmers?status=pending').then(r => r.json()),
             fetch('/api/crop-evaluations?status=pending').then(r => r.json()),
             fetch('/api/loans?status=pending').then(r => r.json())
           ]);
           
           setPendingFarmers(farmers);
           setPendingEvaluations(evaluations);
           setPendingLoans(loans);
         } catch (error) {
           toast.error('Erreur de chargement des données');
         } finally {
           setLoading(false);
         }
       }
       
       loadData();
     }, []);
     
     if (loading) return <LoadingSpinner />;
     
     return (
       <div>
         <h1>Dashboard Coopérative</h1>
         
         <div className="grid grid-cols-3 gap-4 mb-6">
           <Card>
             <h3>Agriculteurs en attente</h3>
             <p className="text-3xl">{pendingFarmers.length}</p>
           </Card>
           <Card>
             <h3>Évaluations en attente</h3>
             <p className="text-3xl">{pendingEvaluations.length}</p>
           </Card>
           <Card>
             <h3>Prêts en attente</h3>
             <p className="text-3xl">{pendingLoans.length}</p>
           </Card>
         </div>
         
         <PendingFarmersValidation farmers={pendingFarmers} />
         <PendingEvaluationsReview evaluations={pendingEvaluations} />
         <LoanApprovalList loans={pendingLoans} />
       </div>
     );
   }
   ```

### Phase 8: Audit de la Gestion des Erreurs

#### Fichiers à Vérifier
```typescript
- src/components/errors/ErrorBoundary.tsx
- src/components/errors/ErrorDisplay.tsx
- src/lib/errors/
- messages/fr.json
- messages/ln.json
```

#### Points de Vérification

1. **ErrorBoundary**
   - Vérifier qu'il entoure l'application principale
   - Confirmer qu'il capture toutes les erreurs React
   - Valider l'affichage des erreurs en Lingala/Français

2. **Gestion des Erreurs API**
   - Vérifier que toutes les routes API retournent des erreurs structurées
   - Confirmer que les codes d'erreur sont cohérents
   - Valider les messages d'erreur traduits

3. **Gestion des Erreurs Blockchain**
   - Erreurs de connexion wallet
   - Erreurs de transaction (gas, fonds insuffisants)
   - Erreurs de contrat (revert)

4. **Corrections à Appliquer**
   ```typescript
   // Si les erreurs blockchain ne sont pas traduites
   // Créer src/lib/errors/blockchain-errors.ts:
   
   export function translateBlockchainError(error: any, lang: string): string {
     const errorMessages = {
       'INSUFFICIENT_FUNDS': {
         fr: 'Fonds insuffisants pour cette transaction',
         ln: 'Mbongo ekoki te mpo na transaction oyo'
       },
       'USER_REJECTED': {
         fr: 'Transaction annulée par l\'utilisateur',
         ln: 'Ozangi transaction'
       },
       'NETWORK_ERROR': {
         fr: 'Erreur de connexion au réseau',
         ln: 'Likambo ya connexion na réseau'
       }
     };
     
     const errorCode = error.code || 'UNKNOWN_ERROR';
     return errorMessages[errorCode]?.[lang] || error.message;
   }
   ```

### Phase 9: Audit de la Base de Données

#### Fichiers à Vérifier
```typescript
- supabase/migrations/
- src/lib/supabase/client.ts
- src/lib/supabase/server.ts
```

#### Points de Vérification

1. **Schéma de Base de Données**
   - Vérifier que toutes les tables existent
   - Confirmer que les relations (foreign keys) sont correctes
   - Valider les types de colonnes

2. **Politiques RLS (Row Level Security)**
   - Vérifier que chaque table a des politiques RLS
   - Confirmer que les utilisateurs ne peuvent accéder qu'à leurs données
   - Tester les cas edge (admin, coopérative)

3. **Requêtes Optimisées**
   - Vérifier que les index sont créés sur les colonnes fréquemment requêtées
   - Confirmer que les jointures sont efficaces
   - Valider que les requêtes n'ont pas de N+1 problems

4. **Corrections à Appliquer**
   ```sql
   -- Si les politiques RLS manquent pour la table loans
   -- Créer une migration supabase/migrations/XXXXXX_add_loans_rls.sql:
   
   -- Enable RLS
   ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
   
   -- Policy: Farmers can view their own loans
   CREATE POLICY "Farmers can view own loans"
     ON loans FOR SELECT
     USING (auth.uid() = borrower_id);
   
   -- Policy: Lenders can view loans they funded
   CREATE POLICY "Lenders can view funded loans"
     ON loans FOR SELECT
     USING (auth.uid() = lender_id);
   
   -- Policy: Cooperatives can view all loans
   CREATE POLICY "Cooperatives can view all loans"
     ON loans FOR SELECT
     USING (
       EXISTS (
         SELECT 1 FROM profiles
         WHERE profiles.id = auth.uid()
         AND profiles.role = 'cooperative'
       )
     );
   ```

### Phase 10: Audit PWA et Responsive

#### Fichiers à Vérifier
```typescript
- public/manifest.json
- public/sw.js
- src/components/pwa/PWAInstallPrompt.tsx
- src/components/pwa/OfflineIndicator.tsx
```

#### Points de Vérification

1. **Configuration PWA**
   - Vérifier que manifest.json est complet
   - Confirmer que les icônes existent dans toutes les tailles
   - Valider que le service worker est enregistré

2. **Responsive Design**
   - Tester toutes les pages sur mobile (320px, 375px, 768px, 1024px)
   - Vérifier que les tableaux sont scrollables horizontalement
   - Confirmer que les formulaires sont utilisables sur mobile

3. **Offline Capability**
   - Vérifier que les pages essentielles fonctionnent hors ligne
   - Confirmer que les données sont mises en cache
   - Valider l'affichage de l'indicateur offline

4. **Corrections à Appliquer**
   ```typescript
   // Si le responsive ne fonctionne pas sur les tableaux
   // Créer un composant ResponsiveTable:
   
   export function ResponsiveTable({ children }: { children: React.ReactNode }) {
     return (
       <div className="overflow-x-auto -mx-4 sm:mx-0">
         <div className="inline-block min-w-full align-middle">
           <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
             {children}
           </div>
         </div>
       </div>
     );
   }
   
   // Utiliser dans les pages:
   <ResponsiveTable>
     <table className="min-w-full divide-y divide-gray-300">
       {/* contenu du tableau */}
     </table>
   </ResponsiveTable>
   ```

## Stratégie de Tests

### Tests d'Intégration

```typescript
// Créer src/__tests__/integration/loan-workflow.test.ts

describe('Loan Workflow Integration', () => {
  it('should complete full loan cycle', async () => {
    // 1. Farmer creates evaluation
    const evaluation = await createEvaluation({
      cropType: 'manioc',
      superficie: 2,
      rendement: 1000,
      prix: 0.5
    });
    
    // 2. Cooperative approves evaluation
    await approveEvaluation(evaluation.id);
    
    // 3. Tokens are minted
    const tokens = await getTokenBalance(farmerId);
    expect(tokens).toBeGreaterThan(0);
    
    // 4. Farmer requests loan
    const loan = await requestLoan({
      amount: 500,
      collateral: 1000
    });
    
    // 5. Cooperative approves loan
    await approveLoan(loan.id);
    
    // 6. USDC is disbursed
    const balance = await getUSDCBalance(farmerId);
    expect(balance).toBe(500);
    
    // 7. Farmer repays loan
    await repayLoan(loan.id, 500);
    
    // 8. Collateral is released
    const finalTokens = await getTokenBalance(farmerId);
    expect(finalTokens).toBe(tokens);
  });
});
```

### Tests de Sécurité

```typescript
// Créer src/__tests__/security/authorization.test.ts

describe('Authorization Tests', () => {
  it('should prevent farmer from accessing cooperative routes', async () => {
    const farmerSession = await loginAsFarmer();
    
    const response = await fetch('/api/farmers?status=pending', {
      headers: { Authorization: `Bearer ${farmerSession.token}` }
    });
    
    expect(response.status).toBe(403);
  });
  
  it('should prevent unauthorized access to loan details', async () => {
    const loan = await createLoan(farmerA);
    const farmerBSession = await loginAs(farmerB);
    
    const response = await fetch(`/api/loans/${loan.id}`, {
      headers: { Authorization: `Bearer ${farmerBSession.token}` }
    });
    
    expect(response.status).toBe(403);
  });
});
```

## Checklist de Validation

### Authentification ✓
- [ ] Login fonctionne avec email/password
- [ ] Register crée un profil avec le bon rôle
- [ ] Middleware protège toutes les routes dashboard
- [ ] Redirections fonctionnent correctement
- [ ] Sessions persistent après refresh

### Wallet ✓
- [ ] Connexion HashPack fonctionne
- [ ] Balances s'affichent correctement
- [ ] Transactions sont signées
- [ ] Erreurs sont gérées gracieusement

### Évaluation des Cultures ✓
- [ ] Formulaire valide les champs
- [ ] Calcul de valeur est correct
- [ ] PDF est généré avec toutes les données
- [ ] Historique s'affiche correctement
- [ ] Approbation coopérative fonctionne

### Système de Prêts ✓
- [ ] Calcul de collatéral (200%) est correct
- [ ] Demande de prêt est soumise à la coopérative
- [ ] Approbation déclenche le décaissement
- [ ] Remboursement libère le collatéral
- [ ] Historique est complet

### Interfaces Spécifiques ✓
- [ ] Dashboard agriculteur affiche toutes les sections
- [ ] Dashboard coopérative liste toutes les demandes
- [ ] Dashboard prêteur affiche les opportunités
- [ ] Navigation entre les pages fonctionne

### Responsive & PWA ✓
- [ ] Toutes les pages sont responsive
- [ ] PWA peut être installée
- [ ] Service worker fonctionne
- [ ] Offline indicator s'affiche

### Base de Données ✓
- [ ] Toutes les tables existent
- [ ] Relations sont correctes
- [ ] Politiques RLS sont en place
- [ ] Requêtes sont optimisées

### Sécurité ✓
- [ ] Pas d'accès non autorisé aux routes
- [ ] Pas d'accès non autorisé aux données
- [ ] Erreurs ne révèlent pas d'informations sensibles
- [ ] Transactions sont validées côté serveur
