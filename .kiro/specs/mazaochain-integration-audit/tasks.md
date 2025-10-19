# Implementation Plan

- [x] 1. Auditer et corriger le système d'authentification et de gestion des rôles





  - Vérifier que AuthContext.tsx fournit toutes les méthodes nécessaires (login, logout, register, user, role)
  - Tester que le middleware.ts protège correctement toutes les routes dashboard selon les rôles
  - Confirmer que les redirections fonctionnent (non-authentifié → login, mauvais rôle → unauthorized)
  - Vérifier que les composants LoginForm et RegisterForm gèrent correctement les erreurs
  - Tester la persistance des sessions après refresh de page
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Auditer et corriger l'intégration du wallet HashPack




  - Vérifier que useWallet.ts gère correctement les états (connected, connecting, disconnected, error)
  - Tester la connexion et déconnexion du wallet sur toutes les pages
  - Confirmer que WalletBalance.tsx affiche correctement les balances USDC et MAZAO
  - Vérifier que le wallet est accessible dans tous les dashboards (farmer, cooperative, lender)
  - Tester la gestion des erreurs de connexion wallet et afficher des messages clairs
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Vérifier l'existence et l'accessibilité de toutes les pages dashboard





  - Confirmer que toutes les routes farmer existent (/, /evaluations, /evaluations/new, /loans, /loans/request, /portfolio)
  - Confirmer que toutes les routes cooperative existent (/, /farmers, /evaluations, /loans)
  - Confirmer que toutes les routes lender existent (/, /opportunities, /portfolio)
  - Tester la navigation entre toutes les pages
  - Créer les pages manquantes en utilisant les composants existants
  - _Requirements: 3.1, 3.2, 3.4_



- [x] 3.1 Auditer et corriger l'intégration des composants dans les pages farmer





  - Vérifier que src/app/[lang]/dashboard/farmer/page.tsx intègre WalletBalance, QuickActions, et les statistiques
  - Confirmer que src/app/[lang]/dashboard/farmer/evaluations/page.tsx utilise EvaluationHistory
  - Vérifier que src/app/[lang]/dashboard/farmer/evaluations/new/page.tsx utilise CropEvaluationForm
  - Confirmer que src/app/[lang]/dashboard/farmer/loans/page.tsx utilise LoanDashboard
  - Vérifier que src/app/[lang]/dashboard/farmer/loans/request/page.tsx utilise LoanRequestForm
  - Confirmer que src/app/[lang]/dashboard/farmer/portfolio/page.tsx affiche les tokens et leur valeur


  - _Requirements: 3.1, 3.2_

- [x] 3.2 Auditer et corriger l'intégration des composants dans les pages cooperative





  - Vérifier que src/app/[lang]/dashboard/cooperative/page.tsx intègre les compteurs et les listes de demandes
  - Confirmer que src/app/[lang]/dashboard/cooperative/farmers/page.tsx utilise PendingFarmersValidation
  - Vérifier que src/app/[lang]/dashboard/cooperative/evaluations/page.tsx utilise PendingEvaluationsReview

  - Confirmer que src/app/[lang]/dashboard/cooperative/loans/page.tsx utilise LoanApprovalList

  - Vérifier que les actions (approuver/rejeter) sont bien câblées aux API routes
  - _Requirements: 3.1, 3.2_

- [x] 3.3 Auditer et corriger l'intégration des composants dans les pages lender





  - Vérifier que src/app/[lang]/dashboard/lender/page.tsx affiche les métriques et opportunités
  - Confirmer que src/app/[lang]/dashboard/lender/opportunities/page.tsx utilise LenderInvestmentDashboard
  - Vérifier que src/app/[lang]/dashboard/lender/portfolio/page.tsx utilise LenderPortfolio
  - Confirmer que RiskAssessmentDisplay est intégré dans les pages appropriées
  - Vérifier que les actions d'investissement sont câblées aux smart contracts
  - _Requirements: 3.1, 3.2_

- [x] 4. Auditer et corriger le responsive design sur toutes les pages




  - Tester chaque page dashboard sur mobile (320px, 375px, 768px)
  - Vérifier que les tableaux sont scrollables horizontalement sur mobile
  - Confirmer que les formulaires sont utilisables sur petit écran
  - Corriger les problèmes de layout identifiés
  - Ajouter des breakpoints Tailwind appropriés où nécessaire
  - _Requirements: 3.5, 12.2, 12.4_

- [x] 5. Vérifier et corriger l'intégration multilingue (Lingala/Français)





  - Confirmer que messages/ln.json et messages/fr.json contiennent toutes les clés nécessaires
  - Vérifier que le LanguageSwitcher fonctionne sur toutes les pages
  - Tester que tous les textes de l'interface sont traduits
  - Ajouter les traductions manquantes
  - Vérifier que les messages d'erreur sont traduits
  - _Requirements: 3.3, 9.1_

- [x] 6. Auditer et corriger la configuration des smart contracts

  - Vérifier que les adresses de contrats sont dans .env (NEXT_PUBLIC_LOAN_MANAGER_ADDRESS, NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS)
  - Confirmer que les ABIs sont à jour dans src/lib/contracts/
  - Tester que useMazaoContracts.ts expose toutes les fonctions nécessaires
  - Vérifier la gestion des erreurs blockchain dans le hook
  - Tester les appels de contrats sur le testnet Hedera
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 7. Auditer et corriger le système d'évaluation des cultures





  - Vérifier que CropEvaluationForm.tsx valide tous les champs (superficie, rendement, prix)
  - Confirmer que le calcul de valeur (superficie × rendement × prix) s'affiche en temps réel
  - Tester la soumission du formulaire et la création de l'évaluation en base de données
  - Vérifier que EvaluationHistory.tsx affiche toutes les évaluations passées
  - Tester la génération de PDF avec toutes les données de l'évaluation
  - _Requirements: 5.1, 5.2, 5.3, 5.4_


- [x] 7.1 Vérifier l'intégration complète du formulaire d'évaluation dans la page

  - Confirmer que src/app/[lang]/dashboard/farmer/evaluations/new/page.tsx importe et utilise CropEvaluationForm
  - Vérifier que le formulaire est entouré de FarmerProtection pour la sécurité
  - Tester que la soumission appelle correctement l'API route /api/crop-evaluations
  - Confirmer que la redirection vers la liste des évaluations fonctionne après soumission
  - Vérifier que les messages de succès/erreur s'affichent correctement
  - _Requirements: 5.1, 5.2_

- [x] 7.2 Vérifier l'intégration de l'historique des évaluations dans la page

  - Confirmer que src/app/[lang]/dashboard/farmer/evaluations/page.tsx utilise EvaluationHistory
  - Vérifier que les données sont chargées depuis l'API /api/crop-evaluations
  - Tester que le filtrage par statut (pending, approved, rejected) fonctionne
  - Confirmer que le clic sur une évaluation ouvre les détails
  - Vérifier que le bouton "Nouvelle évaluation" redirige vers /evaluations/new
  - _Requirements: 5.4_

- [x] 8. Vérifier et corriger le workflow d'approbation des évaluations par la coopérative






  - Confirmer que PendingEvaluationsReview.tsx liste toutes les évaluations en attente
  - Tester les boutons approuver/rejeter et vérifier que le statut est mis à jour
  - Vérifier que l'approbation déclenche le minting de tokens via le smart contract
  - Confirmer que les notifications sont envoyées à l'agriculteur
  - Tester que les tokens apparaissent dans le portfolio de l'agriculteur
  - _Requirements: 5.5, 4.3, 4.4_

- [x] 9. Auditer et corriger le système de demande de prêt





  - Vérifier que LoanRequestForm.tsx calcule correctement le collatéral requis (200%)
  - Confirmer que le montant maximum empruntable est affiché (collatéral disponible / 2)
  - Tester que le formulaire empêche la soumission si collatéral insuffisant
  - Vérifier que la demande est créée en base de données avec le statut 'pending'
  - Confirmer que la coopérative reçoit une notification
  - _Requirements: 6.1, 6.2_



- [x] 9.1 Vérifier l'intégration complète du formulaire de demande de prêt dans la page





  - Confirmer que src/app/[lang]/dashboard/farmer/loans/request/page.tsx utilise LoanRequestForm
  - Vérifier que le composant WalletBalance est affiché pour montrer le collatéral disponible
  - Tester que le formulaire récupère les balances de tokens via useWallet
  - Confirmer que la soumission appelle l'API /api/loans avec les bonnes données
  - Vérifier que la redirection vers /loans fonctionne après soumission réussie
  - _Requirements: 6.1, 6.2_



- [x] 9.2 Vérifier l'intégration du dashboard des prêts dans la page farmer





  - Confirmer que src/app/[lang]/dashboard/farmer/loans/page.tsx utilise LoanDashboard
  - Vérifier que les prêts actifs, en attente et remboursés sont affichés
  - Tester que le clic sur un prêt ouvre les détails avec LoanDetailsPage
  - Confirmer que LoanRepaymentInterface est accessible depuis les détails du prêt
  - Vérifier que le bouton "Demander un prêt" redirige vers /loans/request
  - _Requirements: 6.4, 6.6_

- [x] 10. Vérifier et corriger le workflow d'approbation des prêts par la coopérative





  - Confirmer que LoanApprovalList.tsx liste tous les prêts en attente
  - Vérifier que les détails du prêt sont affichés (agriculteur, montant, collatéral, ratio)
  - Tester les boutons approuver/rejeter et vérifier que le statut est mis à jour
  - Confirmer que l'approbation déclenche le décaissement automatique
  - Vérifier que le rejet envoie une notification à l'agriculteur avec la raison
  - _Requirements: 6.3, 6.4, 6.5_

- [x] 11. Auditer et corriger le système de décaissement automatique des prêts





  - Vérifier que l'approbation d'un prêt déclenche le transfert USDC vers le wallet de l'agriculteur
  - Confirmer que le collatéral est mis en escrow dans le smart contract
  - Tester que le statut du prêt passe à 'active' après décaissement
  - Vérifier que l'agriculteur reçoit une notification avec les détails du prêt
  - Confirmer que le reçu de transaction est généré et accessible
  - _Requirements: 6.3, 6.4_

- [x] 12. Auditer et corriger le système de remboursement des prêts





  - Vérifier que LoanRepaymentInterface.tsx affiche le solde restant et la date d'échéance
  - Tester l'interface de paiement USDC et confirmer que le montant est validé
  - Confirmer que le remboursement met à jour le solde du prêt en base de données
  - Vérifier que le remboursement complet libère automatiquement le collatéral
  - Tester que RepaymentHistory.tsx affiche tous les paiements passés
  - _Requirements: 6.5, 6.6_

- [x] 13. Auditer et corriger le dashboard de la coopérative






  - Vérifier que la page principale affiche les compteurs (agriculteurs, évaluations, prêts en attente)
  - Confirmer que PendingFarmersValidation.tsx liste tous les agriculteurs non validés
  - Tester que la validation d'un agriculteur met à jour son statut is_validated
  - Vérifier que toutes les sections du dashboard chargent les données correctement
  - Corriger les problèmes de chargement ou d'affichage identifiés
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 13.1 Vérifier l'intégration complète du dashboard principal coopérative




  - Confirmer que src/app/[lang]/dashboard/cooperative/page.tsx charge les données via useEffect
  - Vérifier que les compteurs affichent le nombre correct de demandes en attente
  - Tester que les cartes de statistiques sont cliquables et redirigent vers les pages détaillées
  - Confirmer que les composants PendingFarmersValidation, PendingEvaluationsReview, LoanApprovalList sont intégrés
  - Vérifier que le chargement initial affiche un LoadingSpinner
  - _Requirements: 7.1, 7.2_

- [x] 13.2 Vérifier l'intégration des pages de validation coopérative


  - Confirmer que src/app/[lang]/dashboard/cooperative/farmers/page.tsx utilise PendingFarmersValidation
  - Vérifier que src/app/[lang]/dashboard/cooperative/evaluations/page.tsx utilise PendingEvaluationsReview
  - Confirmer que src/app/[lang]/dashboard/cooperative/loans/page.tsx utilise LoanApprovalList
  - Tester que les actions (approuver/rejeter) appellent les bonnes API routes
  - Vérifier que les notifications sont envoyées après chaque action
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 14. Auditer et corriger le dashboard du prêteur




  - Vérifier que LenderInvestmentDashboard.tsx affiche les opportunités de prêt disponibles
  - Confirmer que RiskAssessmentDisplay.tsx affiche les métriques de risque pour chaque prêt
  - Tester que LenderPortfolio.tsx affiche tous les investissements actifs
  - Vérifier que l'interface de commitment de fonds fonctionne
  - Confirmer que la distribution automatique des intérêts est implémentée
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 14.1 Vérifier l'intégration complète du dashboard principal prêteur


  - Confirmer que src/app/[lang]/dashboard/lender/page.tsx affiche les métriques clés (total investi, rendement, prêts actifs)
  - Vérifier que les opportunités de prêt sont listées avec RiskAssessmentDisplay
  - Tester que le clic sur une opportunité ouvre les détails du prêt
  - Confirmer que le bouton "Investir" est fonctionnel et appelle le smart contract
  - Vérifier que les données sont chargées depuis l'API /api/loans?status=approved
  - _Requirements: 8.1, 8.2_

- [x] 14.2 Vérifier l'intégration des pages spécifiques prêteur


  - Confirmer que src/app/[lang]/dashboard/lender/opportunities/page.tsx utilise LenderInvestmentDashboard
  - Vérifier que src/app/[lang]/dashboard/lender/portfolio/page.tsx utilise LenderPortfolio
  - Tester que le portfolio affiche tous les prêts financés avec leur statut
  - Confirmer que les rendements et intérêts sont calculés et affichés correctement
  - Vérifier que l'historique des distributions est accessible
  - _Requirements: 8.3, 8.4, 8.5_

- [x] 15. Auditer et corriger la gestion des erreurs dans toute l'application





  - Vérifier que ErrorBoundary.tsx entoure l'application et capture les erreurs React
  - Confirmer que toutes les routes API retournent des erreurs structurées avec codes
  - Tester que les erreurs blockchain sont traduites en Lingala/Français
  - Vérifier que les validations de formulaire affichent des messages clairs
  - Créer une fonction utilitaire pour traduire les erreurs blockchain
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 16. Auditer et corriger le schéma de base de données Supabase








  - Vérifier que toutes les tables nécessaires existent (profiles, crop_evaluations, loans, transactions)
  - Confirmer que les relations (foreign keys) sont correctes
  - Vérifier que les types de colonnes sont appropriés
  - Créer les migrations manquantes si nécessaire
  - Tester que les requêtes fonctionnent correctement
  - _Requirements: 10.1, 10.2, 10.4_

- [ ] 17. Auditer et corriger les politiques RLS (Row Level Security)





  - Vérifier que chaque table a des politiques RLS activées
  - Confirmer que les agriculteurs ne peuvent voir que leurs propres données
  - Tester que les coopératives peuvent voir les données de leurs agriculteurs
  - Vérifier que les prêteurs ne peuvent voir que leurs investissements
  - Créer les politiques RLS manquantes
  - _Requirements: 10.3_

- [ ] 18. Optimiser les requêtes de base de données
  - Identifier les requêtes lentes avec EXPLAIN ANALYZE
  - Créer des index sur les colonnes fréquemment requêtées (user_id, status, created_at)
  - Vérifier qu'il n'y a pas de problèmes N+1
  - Utiliser des jointures efficaces au lieu de requêtes multiples
  - Tester les performances après optimisation
  - _Requirements: 10.5_

- [x] 19. Auditer et corriger la configuration PWA




  - Vérifier que public/manifest.json contient toutes les informations nécessaires
  - Confirmer que toutes les icônes existent dans les tailles requises (192x192, 512x512)
  - Tester que le service worker (public/sw.js) est enregistré correctement
  - Vérifier que PWAInstallPrompt.tsx s'affiche au bon moment
  - Tester l'installation de la PWA sur mobile
  - _Requirements: 12.1, 12.3_

- [x] 20. Auditer et corriger les fonctionnalités offline





  - Vérifier que OfflineIndicator.tsx détecte correctement le statut de connexion
  - Tester que les pages essentielles fonctionnent hors ligne
  - Confirmer que les données sont mises en cache par le service worker
  - Vérifier que les actions offline sont synchronisées au retour en ligne
  - Corriger les problèmes de cache identifiés
  - _Requirements: 12.5_

- [ ] 21. Créer des tests d'intégration pour les workflows critiques
  - Écrire un test pour le workflow complet d'évaluation (création → approbation → minting)
  - Écrire un test pour le workflow complet de prêt (demande → approbation → décaissement → remboursement)
  - Écrire un test pour la validation d'un agriculteur par la coopérative
  - Tester que tous les tests passent
  - Corriger les bugs identifiés par les tests
  - _Requirements: 11.1, 11.2, 11.4_

- [ ] 22. Créer des tests de sécurité pour l'autorisation
  - Écrire des tests vérifiant qu'un agriculteur ne peut pas accéder aux routes coopérative
  - Écrire des tests vérifiant qu'un utilisateur ne peut pas accéder aux données d'un autre
  - Tester que les routes API vérifient correctement les permissions
  - Vérifier que les politiques RLS empêchent les accès non autorisés
  - Corriger les failles de sécurité identifiées
  - _Requirements: 11.1, 11.4_

- [ ] 23. Créer des tests pour les smart contracts
  - Écrire des tests unitaires pour toutes les fonctions de LoanManager.sol
  - Écrire des tests unitaires pour toutes les fonctions de MazaoTokenFactory.sol
  - Tester les cas edge (collatéral insuffisant, montant invalide, etc.)
  - Vérifier que tous les tests passent
  - Corriger les bugs de contrat identifiés
  - _Requirements: 11.3, 11.4_

- [ ] 24. Mesurer et améliorer la couverture de code
  - Exécuter les tests avec coverage (npm run test:coverage)
  - Identifier les fichiers avec une couverture < 70%
  - Ajouter des tests pour améliorer la couverture
  - Vérifier que la couverture globale atteint au moins 70%
  - Documenter les zones non testées avec justification
  - _Requirements: 11.5_

- [ ] 25. Vérifier l'intégration des API routes avec les composants frontend
  - Confirmer que toutes les API routes (/api/crop-evaluations, /api/loans, /api/farmers, /api/metrics) existent
  - Tester que chaque API route vérifie l'authentification et les permissions
  - Vérifier que les composants frontend appellent les bonnes API routes
  - Confirmer que les réponses API sont correctement typées et utilisées
  - Tester la gestion des erreurs API dans les composants
  - _Requirements: 3.1, 3.2, 4.4_

- [ ] 26. Vérifier l'intégration des hooks personnalisés dans les composants
  - Confirmer que useAuth est utilisé dans tous les composants nécessitant l'authentification
  - Vérifier que useWallet est utilisé dans tous les composants nécessitant le wallet
  - Tester que useMazaoContracts est utilisé pour toutes les interactions blockchain
  - Confirmer que useNotifications est utilisé pour afficher les notifications
  - Vérifier que les hooks retournent les bonnes données et méthodes
  - _Requirements: 1.1, 2.1, 4.1_

- [ ] 27. Effectuer un audit final et créer un rapport de validation
  - Parcourir la checklist de validation du design document
  - Tester manuellement tous les workflows sur desktop et mobile
  - Vérifier que toutes les fonctionnalités du MVP original sont opérationnelles
  - Documenter les bugs restants et leur priorité
  - Créer un rapport final avec les corrections effectuées et les recommandations
  - _Requirements: 1.1-12.5_
