# Implementation Plan - Complétion des Politiques et Workflows MazaoChain

## Phase 1: Infrastructure de Base et Sécurité

- [ ] 1. Configurer l'infrastructure de sécurité et chiffrement
  - Créer le service EncryptionService avec chiffrement AES-256
  - Implémenter les fonctions encryptData, decryptData, hashDocument
  - Configurer l'intégration avec AWS KMS ou équivalent pour la gestion des clés
  - Créer la table encrypted_user_data dans Supabase
  - Ajouter les migrations de base de données pour les données chiffrées
  - _Requirements: 4.1, 4.4_

- [ ] 2. Implémenter l'authentification à deux facteurs (2FA)
  - Créer le service TwoFactorAuthService
  - Implémenter la génération de secrets TOTP
  - Créer les fonctions enableTwoFactor, verifyTwoFactorCode, generateBackupCodes
  - Créer la table two_factor_auth dans Supabase
  - Créer les API endpoints /api/auth/2fa/enable et /api/auth/2fa/verify
  - Créer le composant UI TwoFactorSetup pour l'activation
  - Créer le composant UI TwoFactorVerification pour la vérification
  - _Requirements: 4.2, 4.3_

- [ ] 3. Intégrer le service KYC/AML
  - Créer le service KYCAMLService
  - Implémenter requiresKYC, initiateKYCVerification, checkKYCStatus
  - Créer la table kyc_verifications dans Supabase
  - Intégrer un provider KYC externe (ex: Onfido, Jumio)
  - Créer les API endpoints /api/kyc/initiate et /api/kyc/documents
  - Créer le composant UI KYCVerificationFlow
  - Ajouter la vérification KYC automatique pour prêts > 1,000$
  - _Requirements: 4.5_

- [ ] 4. Configurer le stockage IPFS pour les documents
  - Configurer l'intégration IPFS (Pinata, Infura, ou nœud local)
  - Implémenter storeOnIPFS et verifyDocumentHash dans EncryptionService
  - Créer la table document_hashes dans Supabase
  - Créer l'API endpoint /api/documents/upload pour l'upload IPFS
  - Créer le composant UI DocumentUpload avec vérification de hash
  - _Requirements: 4.4_

## Phase 2: Période de Grâce et Notifications

- [ ] 5. Implémenter le système de période de grâce
  - Créer le service GracePeriodManager
  - Implémenter checkGracePeriodStatus et calculateLateFees
  - Ajouter les champs grace_period_start, grace_period_end, late_fees_accumulated à la table loans
  - Créer la fonction processExpiredGracePeriods pour le traitement automatique
  - Créer l'API endpoint /api/loans/:loanId/grace-period
  - Modifier le service loan pour activer automatiquement la période de grâce à l'échéance
  - _Requirements: 1.1, 1.2, 1.6_

- [ ] 6. Créer le système de notifications programmées
  - Créer la table scheduled_notifications dans Supabase
  - Créer le service NotificationScheduler
  - Implémenter scheduleNotification et sendMultiChannelNotification
  - Créer les API endpoints /api/notifications/schedule et /api/notifications/scheduled
  - Implémenter la logique de retry avec délai exponentiel
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 7. Implémenter les notifications J-7, J-3, J-1
  - Modifier scheduleGracePeriodNotifications pour programmer les 3 notifications
  - Créer les templates de messages pour SMS, Email et In-app
  - Implémenter l'envoi multi-canal simultané
  - Créer un worker/cron job pour traiter les notifications programmées
  - Ajouter les logs de livraison dans sms_logs et email_logs
  - _Requirements: 1.3, 1.4, 1.5, 6.3_

- [ ] 8. Implémenter les préférences de notification par utilisateur
  - Modifier la table notification_preferences pour supporter les préférences par type d'événement
  - Créer l'API endpoint /api/notifications/preferences
  - Créer le composant UI NotificationPreferences
  - Implémenter getNotificationPreferences dans NotificationScheduler
  - Respecter les préférences lors de l'envoi des notifications
  - _Requirements: 6.5_

## Phase 3: Frais et Gestion Financière

- [ ] 9. Implémenter le système de frais de service
  - Créer la table service_fees dans Supabase
  - Créer le service FeeManager
  - Implémenter calculateServiceFees avec répartition 1.2%/0.6%/0.2%
  - Implémenter distributeServiceFees pour la distribution automatique
  - Modifier le service loan pour déduire les frais lors de la création du prêt
  - Créer l'API endpoint /api/loans/:loanId/fees
  - _Requirements: 1.7_

- [ ] 10. Implémenter les frais de retard
  - Implémenter calculateLateFees dans FeeManager (0.1% par jour)
  - Modifier processExpiredGracePeriods pour appliquer les frais de retard
  - Ajouter le champ days_overdue à la table loans
  - Créer un worker/cron job pour calculer et appliquer les frais quotidiens
  - Envoyer des notifications quotidiennes pour les prêts en retard
  - _Requirements: 1.6, 6.7_

- [ ] 11. Créer le système de fonds de réserve
  - Créer la table reserve_fund dans Supabase
  - Implémenter la logique pour placer 10% des prêts en réserve
  - Créer l'API endpoint /api/reserve-fund/balance
  - Créer le composant UI ReserveFundDashboard pour les admins
  - Implémenter l'utilisation du fonds en cas de défaut
  - _Requirements: 3.5_

## Phase 4: Évaluation des Récoltes Améliorée

- [ ] 12. Implémenter le facteur qualité
  - Créer la table agricultural_practices dans Supabase
  - Créer le service QualityFactorCalculator
  - Implémenter calculateQualityFactor avec les sous-fonctions (organic, irrigation, equipment, etc.)
  - Assurer que le facteur est entre 0.8 et 1.2
  - Créer l'API endpoint /api/evaluations/:id/practices
  - _Requirements: 2.1, 2.2_

- [ ] 13. Ajouter l'historique de rendement sur 3 ans
  - Modifier la table agricultural_practices pour inclure historical_yields (JSONB)
  - Créer le composant UI HistoricalYieldInput
  - Implémenter evaluateHistoricalYield dans QualityFactorCalculator
  - Modifier le formulaire d'évaluation pour demander les 3 dernières années
  - _Requirements: 2.3_

- [ ] 14. Intégrer la validation par géolocalisation
  - Ajouter les champs latitude, longitude à la table crop_evaluations
  - Créer le composant UI LocationPicker avec carte interactive
  - Implémenter la validation de localisation avec les données de la coopérative
  - Créer l'API endpoint /api/evaluations/:id/validate-location
  - _Requirements: 2.4_

- [ ] 15. Améliorer le rapport d'évaluation
  - Créer le service EvaluationReportGenerator
  - Générer un rapport PDF détaillé avec tous les facteurs
  - Inclure les photos de la culture dans le rapport
  - Créer l'API endpoint /api/evaluations/:id/report
  - Créer le composant UI EvaluationReport pour visualisation
  - _Requirements: 2.5_

- [ ] 16. Implémenter l'upload de photos de culture
  - Créer l'API endpoint /api/evaluations/:id/photos
  - Créer le composant UI CropPhotoUpload
  - Stocker les photos sur IPFS avec hash de vérification
  - Afficher les photos dans le rapport d'évaluation
  - _Requirements: 2.6_

- [ ] 17. Appliquer le buffer de +20% pour le collatéral
  - Modifier le calcul de valeur dans crop-evaluation.ts
  - Appliquer le buffer uniquement pour le calcul du collatéral
  - Documenter la différence entre valeur estimée et valeur de collatéral
  - _Requirements: 2.7_

## Phase 5: Score de Crédit et Historique

- [ ] 18. Créer le moteur de score de crédit
  - Créer la table credit_scores dans Supabase
  - Créer le service CreditScoreEngine
  - Implémenter calculateCreditScore avec tous les facteurs
  - Créer l'algorithme de calcul (0-100) basé sur l'historique
  - Créer l'API endpoint /api/farmers/:id/credit-score
  - _Requirements: 7.1, 7.6_

- [ ] 19. Mettre à jour le score lors des événements
  - Implémenter updateScoreOnRepayment dans CreditScoreEngine
  - Appeler la mise à jour lors du remboursement à temps
  - Appeler la mise à jour lors des retards de paiement
  - Appeler la mise à jour lors des défauts
  - _Requirements: 7.1, 7.2_

- [ ] 20. Implémenter les avantages du bon score
  - Implémenter determineLoanLimits basé sur le score
  - Implémenter determineInterestRate basé sur le score
  - Modifier le service loan pour utiliser les limites et taux personnalisés
  - Créer l'API endpoint /api/farmers/:id/loan-limits
  - _Requirements: 7.3, 7.4, 7.5_

- [ ] 21. Créer l'interface de visualisation du score
  - Créer le composant UI CreditScoreDisplay
  - Afficher le score avec un graphique visuel
  - Afficher les facteurs qui influencent le score
  - Afficher l'historique d'évolution du score
  - Intégrer dans le dashboard agriculteur
  - _Requirements: 7.7_

## Phase 6: Gestion des Risques Avancée

- [ ] 22. Implémenter le monitoring des prix
  - Créer le service MarginCallManager
  - Implémenter monitorCollateralValues pour vérifier les valeurs en temps réel
  - Créer un worker/cron job pour vérifier les prix toutes les heures
  - Implémenter alertPriceDrops pour détecter les baisses > 15%
  - Envoyer des alertes aux prêteurs concernés
  - _Requirements: 3.1, 6.6_

- [ ] 23. Implémenter les appels de marge
  - Créer la table margin_calls dans Supabase
  - Implémenter triggerMarginCall quand le collatéral < 150%
  - Créer l'API endpoint /api/loans/:loanId/margin-call
  - Envoyer des notifications à l'agriculteur avec deadline de 7 jours
  - Créer le composant UI MarginCallAlert
  - _Requirements: 3.2, 3.3_

- [ ] 24. Permettre l'ajout de collatéral supplémentaire
  - Implémenter processMarginCallResponse dans MarginCallManager
  - Créer l'API endpoint /api/loans/:loanId/add-collateral
  - Créer le composant UI AddCollateralForm
  - Mettre à jour le statut du margin call lors de l'ajout
  - Envoyer une confirmation à l'agriculteur et au prêteur
  - _Requirements: 3.3_

- [ ] 25. Implémenter l'assurance optionnelle
  - Créer la table insurance_policies dans Supabase
  - Créer le service InsuranceService
  - Intégrer un provider d'assurance externe (ex: Etherisc)
  - Créer l'API endpoint /api/insurance/quote
  - Créer le composant UI InsuranceOption dans le formulaire de prêt
  - _Requirements: 3.4_

## Phase 7: Liquidation Graduelle

- [ ] 26. Créer le système de liquidation graduelle
  - Créer la table liquidation_processes dans Supabase
  - Créer le service LiquidationManager
  - Implémenter initiateLiquidation pour les prêts à 45 jours de retard
  - Créer l'API endpoint /api/loans/:loanId/liquidation/initiate
  - _Requirements: 1.8, 9.1_

- [ ] 27. Implémenter les phases de liquidation
  - Implémenter processLiquidationPhase pour gérer les transitions
  - Phase 1 (Jour 0-15): Période de grâce + notifications intensives
  - Phase 2 (Jour 16-30): Négociation et restructuration
  - Phase 3 (Jour 31-45): Procédure de liquidation formelle
  - Phase 4 (Jour 46+): Vente sur marché secondaire
  - Créer un worker/cron job pour vérifier et avancer les phases
  - _Requirements: 9.2_

- [ ] 28. Implémenter la négociation de restructuration
  - Implémenter negotiateRestructuring dans LiquidationManager
  - Créer l'API endpoint /api/loans/:loanId/liquidation/negotiate
  - Créer le composant UI RestructuringProposal
  - Notifier la coopérative pour médiation
  - Enregistrer les propositions dans liquidation_processes.negotiation_proposals
  - _Requirements: 9.3, 9.4_

- [ ] 29. Implémenter la liquidation finale
  - Implémenter executeFinalLiquidation dans LiquidationManager
  - Implémenter sellOnSecondaryMarket pour vendre les tokens
  - Calculer les frais de liquidation (5%)
  - Distribuer les fonds: frais → prêteur → agriculteur (surplus)
  - Générer un rapport de liquidation détaillé
  - _Requirements: 9.5, 9.6, 9.7_

- [ ] 30. Créer l'interface de suivi de liquidation
  - Créer le composant UI LiquidationStatus
  - Afficher la phase actuelle et le temps restant
  - Afficher les propositions de restructuration
  - Permettre la soumission de nouvelles propositions
  - Créer l'API endpoint /api/loans/:loanId/liquidation/status
  - _Requirements: 9.2_

## Phase 8: Résolution des Litiges

- [ ] 31. Créer le système de gestion des litiges
  - Créer la table disputes dans Supabase
  - Créer le service DisputeResolutionService
  - Implémenter createDispute et escalateDispute
  - Créer l'API endpoint /api/disputes/create
  - _Requirements: 10.1_

- [ ] 32. Implémenter les niveaux de médiation
  - Implémenter la logique des 4 niveaux: Support → Coopérative → Arbitrage → Légal
  - Créer l'API endpoint /api/disputes/:id/escalate
  - Notifier les parties appropriées à chaque niveau
  - Enregistrer toutes les décisions sur HCS
  - _Requirements: 10.1, 10.2_

- [ ] 33. Implémenter le système d'escrow pour litiges
  - Implémenter placeInEscrow et releaseEscrow dans DisputeResolutionService
  - Bloquer les fonds concernés lors de la création du litige
  - Libérer les fonds selon la décision finale
  - Créer l'API endpoint /api/disputes/:id/escrow
  - _Requirements: 10.7_

- [ ] 34. Créer l'interface de gestion des litiges
  - Créer le composant UI DisputeForm pour créer un litige
  - Créer le composant UI DisputeDetails pour voir les détails
  - Créer le composant UI DisputeTimeline pour suivre l'historique
  - Permettre l'upload de documents de preuve
  - Créer l'API endpoint /api/disputes/:id/decision
  - _Requirements: 10.3, 10.5_

- [ ] 35. Implémenter le délai de résolution de 30 jours
  - Ajouter le champ deadline à la table disputes (30 jours)
  - Créer des alertes pour les litiges approchant la deadline
  - Escalader automatiquement si la deadline est dépassée
  - Générer un rapport final à la résolution
  - _Requirements: 10.4, 10.6_

## Phase 9: Rapports et Tableaux de Bord

- [ ] 36. Améliorer le dashboard agriculteur
  - Afficher le solde du prêt en temps réel
  - Afficher les intérêts accumulés
  - Afficher la prochaine échéance avec compte à rebours
  - Afficher la valeur actuelle du collatéral
  - Afficher le score de crédit
  - _Requirements: 8.1_

- [ ] 37. Créer le système de reçus de transaction
  - Améliorer transactionReceiptService pour générer des reçus détaillés
  - Créer des templates PDF pour les reçus
  - Envoyer automatiquement par email après chaque transaction
  - Créer l'API endpoint /api/transactions/:id/receipt
  - _Requirements: 8.2_

- [ ] 38. Implémenter les rapports mensuels
  - Créer le service MonthlyReportGenerator
  - Générer un rapport mensuel pour chaque agriculteur
  - Inclure: transactions, remboursements, intérêts, valeur du collatéral
  - Créer un worker/cron job pour générer les rapports le 1er de chaque mois
  - Envoyer par email et rendre disponible dans le dashboard
  - _Requirements: 8.3_

- [ ] 39. Créer le dashboard coopérative
  - Créer le composant UI CooperativeDashboard
  - Afficher la performance globale du portefeuille
  - Afficher les alertes risques regroupés
  - Afficher les rapports d'impact communautaire
  - Créer l'API endpoint /api/cooperative/dashboard
  - _Requirements: 8.4_

- [ ] 40. Créer le dashboard prêteur
  - Créer le composant UI LenderDashboard
  - Afficher la performance du portefeuille
  - Afficher l'analyse de risque agrégée
  - Afficher les métriques d'impact social
  - Créer l'API endpoint /api/lender/dashboard
  - _Requirements: 8.5_

- [ ] 41. Implémenter l'export de rapports
  - Créer le service ReportExportService
  - Supporter les formats PDF et CSV
  - Créer l'API endpoint /api/reports/export
  - Créer le composant UI ExportButton
  - _Requirements: 8.6_

- [ ] 42. Créer les alertes de risque en temps réel
  - Implémenter un système de WebSocket pour les alertes temps réel
  - Afficher les alertes dans le dashboard avec badge de notification
  - Créer le composant UI RiskAlertPanel
  - Catégoriser les alertes par niveau de sévérité
  - _Requirements: 8.7_

## Phase 10: Workflow d'Onboarding Complet

- [ ] 43. Créer le workflow d'onboarding guidé
  - Créer le composant UI OnboardingWizard avec étapes progressives
  - Étape 1: Vérification d'identité
  - Étape 2: Profil agricole
  - Étape 3: Configuration technique
  - Sauvegarder la progression pour reprendre plus tard
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 44. Implémenter la vérification d'identité
  - Créer le composant UI IdentityVerification
  - Demander pièce d'identité et preuve de résidence
  - Upload des documents vers IPFS
  - Envoyer une notification à la coopérative pour validation
  - Créer l'API endpoint /api/onboarding/identity
  - _Requirements: 5.1, 5.2_

- [ ] 45. Créer le formulaire de profil agricole complet
  - Créer le composant UI AgriculturalProfileForm
  - Demander: superficie, localisation (GPS), cultures actuelles et historiques
  - Demander: rendements des 3 dernières années
  - Demander: équipement et pratiques agricoles
  - Créer l'API endpoint /api/onboarding/profile
  - _Requirements: 5.3_

- [ ] 46. Implémenter la configuration du wallet
  - Créer le composant UI WalletSetupGuide
  - Guider l'installation de HashPack Wallet
  - Demander le backup de la seed phrase avec confirmation
  - Effectuer une transaction test de 0.1$
  - Créer l'API endpoint /api/onboarding/wallet
  - _Requirements: 5.4, 5.5, 5.6_

- [ ] 47. Optimiser le temps d'onboarding
  - Pré-remplir les champs quand possible
  - Utiliser l'auto-complétion pour les adresses
  - Permettre l'upload de documents par glisser-déposer
  - Afficher une barre de progression
  - Viser un temps total de 15 minutes maximum
  - _Requirements: 5.7_

## Phase 11: Tests et Optimisation

- [ ]* 48. Tests unitaires des services
  - Tester GracePeriodManager avec différents scénarios
  - Tester QualityFactorCalculator avec valeurs limites
  - Tester CreditScoreEngine avec historiques variés
  - Tester FeeManager avec différents montants
  - Tester tous les nouveaux services créés
  - _Requirements: All_

- [ ]* 49. Tests d'intégration end-to-end
  - Tester le cycle complet: Onboarding → Évaluation → Prêt → Remboursement
  - Tester le cycle: Prêt → Retard → Période de grâce → Frais → Liquidation
  - Tester le cycle: Prix baisse → Margin call → Ajout collatéral
  - Tester le cycle: Litige → Escalade → Résolution
  - _Requirements: All_

- [ ]* 50. Tests de performance
  - Tester le scheduler de notifications avec 1000+ notifications
  - Tester le monitoring de prix avec 100+ prêts actifs
  - Tester le chiffrement/déchiffrement avec gros volumes
  - Tester l'upload IPFS avec fichiers volumineux
  - _Requirements: All_

- [ ]* 51. Audit de sécurité
  - Vérifier le chiffrement AES-256 de toutes les données sensibles
  - Vérifier l'implémentation 2FA
  - Vérifier les politiques RLS sur toutes les tables
  - Tester la résistance aux attaques courantes (SQL injection, XSS, CSRF)
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 52. Optimisation des performances
  - Ajouter des index sur les colonnes fréquemment requêtées
  - Implémenter le cache Redis pour les données fréquentes
  - Optimiser les requêtes N+1
  - Implémenter la pagination pour les listes longues
  - _Requirements: All_

- [ ] 53. Documentation complète
  - Documenter tous les nouveaux services et API
  - Créer des guides utilisateur pour chaque rôle
  - Documenter les processus de liquidation et résolution de litiges
  - Créer des diagrammes de flux pour les workflows complexes
  - _Requirements: All_

## Phase 12: Déploiement et Monitoring

- [ ] 54. Configurer les workers et cron jobs
  - Configurer le worker pour les notifications programmées (toutes les minutes)
  - Configurer le worker pour le monitoring des prix (toutes les heures)
  - Configurer le worker pour les frais de retard (quotidien)
  - Configurer le worker pour les rapports mensuels (mensuel)
  - Configurer le worker pour les phases de liquidation (quotidien)
  - _Requirements: All_

- [ ] 55. Configurer le monitoring et les alertes
  - Configurer Sentry pour le tracking des erreurs
  - Configurer les métriques Prometheus/Grafana
  - Créer des dashboards de monitoring
  - Configurer les alertes pour les événements critiques
  - _Requirements: All_

- [ ] 56. Migration des données existantes
  - Migrer les prêts existants vers le nouveau schéma
  - Calculer les scores de crédit initiaux pour tous les agriculteurs
  - Migrer les évaluations existantes avec facteur qualité par défaut
  - Vérifier l'intégrité des données après migration
  - _Requirements: All_

- [ ] 57. Déploiement progressif
  - Déployer en environnement de staging
  - Tester avec un groupe pilote d'utilisateurs
  - Collecter les retours et ajuster
  - Déployer en production avec feature flags
  - Activer progressivement les nouvelles fonctionnalités
  - _Requirements: All_

- [ ] 58. Formation des utilisateurs
  - Créer des tutoriels vidéo pour chaque nouvelle fonctionnalité
  - Organiser des sessions de formation pour les coopératives
  - Créer une FAQ complète
  - Mettre en place un support utilisateur dédié
  - _Requirements: All_
