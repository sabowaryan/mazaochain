# Requirements Document - Complétion des Politiques et Workflows MazaoChain

## Introduction

Ce document définit les exigences pour compléter l'implémentation des politiques et workflows de MazaoChain selon la spécification complète fournie. L'analyse de l'implémentation actuelle révèle que plusieurs fonctionnalités critiques sont partiellement implémentées ou manquantes.

### État Actuel de l'Implémentation

**✅ Implémenté:**
- Ratio de collateralisation 200% (COLLATERAL_RATIO = 2.0)
- Calcul de base des intérêts (12% annuel)
- Système de tokenisation avec Hedera
- Évaluation des récoltes avec formule de base
- Oracle de prix manuel
- Notifications de base (in-app, email, SMS infrastructure)
- Système de prêt et remboursement de base
- Liquidation de collatéral (partiel)

**⚠️ Partiellement Implémenté:**
- Période de grâce (infrastructure présente mais pas de logique de 15 jours)
- Notifications programmées (J-7, J-3, J-1)
- Facteur qualité dans l'évaluation (0.8-1.2)
- Score de crédit agriculteur
- Frais et commissions (2% avec répartition)
- Workflow d'onboarding complet

**❌ Manquant:**
- Période de grâce de 15 jours avec notifications automatiques
- Frais de retard (0.1% par jour)
- Frais de service (2% avec répartition plateforme/coopérative/réserve)
- Facteur qualité dans l'évaluation des récoltes
- Validation par géolocalisation
- Historique de rendement sur 3 ans
- Appel de marge automatique (si prix baisse >15%)
- Assurance optionnelle
- Fonds de réserve (10% des prêts)
- Marché secondaire pour MazaoTokens
- Procédure de liquidation graduelle (30 jours)
- KYC/AML pour prêts > 1,000$
- Chiffrement AES-256 des données
- Authentification à deux facteurs (2FA)
- Stockage IPFS des documents
- Système de médiation et résolution des litiges
- Rapports automatiques mensuels
- Dashboard de performance coopérative
- Analyse d'impact social

## Requirements

### Requirement 1: Politique de Prêt Complète

**User Story:** En tant qu'agriculteur, je veux bénéficier d'une période de grâce de 15 jours après l'échéance de mon prêt sans pénalités, afin d'avoir le temps de vendre ma récolte et rembourser mon prêt.

#### Acceptance Criteria

1. WHEN un prêt atteint sa date d'échéance THEN le système SHALL activer automatiquement une période de grâce de 15 jours
2. WHEN un prêt est dans la période de grâce THEN le système SHALL NOT appliquer de pénalités ou frais de retard
3. WHEN un prêt est à J-7 avant l'échéance THEN le système SHALL envoyer une notification SMS, email et in-app à l'agriculteur
4. WHEN un prêt est à J-3 avant l'échéance THEN le système SHALL envoyer une notification de rappel
5. WHEN un prêt est à J-1 avant l'échéance THEN le système SHALL envoyer une notification urgente
6. WHEN la période de grâce expire sans remboursement THEN le système SHALL appliquer des frais de retard de 0.1% par jour
7. WHEN un prêt est créé THEN le système SHALL déduire 2% de frais de service répartis comme suit: 1.2% plateforme, 0.6% coopérative, 0.2% fonds de réserve
8. WHEN un prêt dépasse 45 jours de retard THEN le système SHALL initier la procédure de liquidation graduelle

### Requirement 2: Évaluation des Récoltes Améliorée

**User Story:** En tant que coopérative, je veux que l'évaluation des récoltes prenne en compte la qualité des pratiques agricoles et l'historique de rendement, afin d'avoir une valorisation plus précise et équitable.

#### Acceptance Criteria

1. WHEN une évaluation est créée THEN le système SHALL calculer la valeur selon: Superficie × Rendement Historique × Prix Marché × Facteur Qualité
2. WHEN le facteur qualité est calculé THEN il SHALL être compris entre 0.8 et 1.2 basé sur les pratiques agricoles
3. WHEN une évaluation est soumise THEN le système SHALL demander l'historique de rendement des 3 dernières années
4. WHEN une évaluation inclut des coordonnées GPS THEN le système SHALL valider la localisation avec les données de la coopérative
5. WHEN une évaluation est approuvée THEN le système SHALL générer un rapport d'évaluation détaillé partagé avec l'agriculteur
6. WHEN une évaluation est créée THEN le système SHALL permettre l'upload de photos de la culture
7. WHEN une évaluation utilise le prix du marché THEN le système SHALL appliquer un buffer de +20% pour le collatéral

### Requirement 3: Gestion des Risques Avancée

**User Story:** En tant que prêteur, je veux être alerté automatiquement quand la valeur du collatéral baisse significativement, afin de pouvoir demander un collatéral supplémentaire et protéger mon investissement.

#### Acceptance Criteria

1. WHEN le prix d'une culture baisse de plus de 15% THEN le système SHALL envoyer une alerte automatique à tous les prêteurs concernés
2. WHEN la valeur du collatéral tombe en dessous de 150% du prêt THEN le système SHALL déclencher un appel de marge
3. WHEN un appel de marge est déclenché THEN l'agriculteur SHALL avoir 7 jours pour ajouter du collatéral supplémentaire
4. WHEN un agriculteur demande un prêt THEN le système SHALL proposer une assurance optionnelle pour couvrir les risques météo/maladie
5. WHEN un prêt est accordé THEN 10% du montant SHALL être placé dans un fonds de réserve
6. WHEN un défaut de paiement survient après 45 jours THEN le système SHALL initier une procédure de liquidation graduelle sur 30 jours
7. WHEN la liquidation est initiée THEN le système SHALL suivre le processus: Jour 0-15 (notifications), Jour 16-30 (négociation), Jour 31-45 (liquidation), Jour 46+ (vente sur marché secondaire)

### Requirement 4: Sécurité et Confidentialité Renforcées

**User Story:** En tant qu'utilisateur, je veux que mes données personnelles soient protégées par chiffrement et que je puisse contrôler l'accès à mes informations, afin de garantir ma vie privée et la sécurité de mes données.

#### Acceptance Criteria

1. WHEN des données personnelles sont stockées THEN elles SHALL être chiffrées avec AES-256
2. WHEN un utilisateur se connecte THEN le système SHALL proposer l'authentification à deux facteurs (2FA)
3. WHEN un utilisateur active la 2FA THEN le système SHALL exiger un code de vérification à chaque connexion
4. WHEN des documents sont uploadés THEN leur hash SHALL être stocké sur IPFS pour vérification
5. WHEN un prêt dépasse 1,000$ THEN le système SHALL exiger une vérification KYC/AML complète
6. WHEN un utilisateur consent à l'usage de ses données THEN ce consentement SHALL être opt-in et traçable
7. WHEN une transaction blockchain est effectuée THEN elle SHALL utiliser des pseudonymes sur le ledger public
8. WHEN une opération est effectuée THEN elle SHALL être tracée sur Hedera Consensus Service (HCS)

### Requirement 5: Workflow d'Onboarding Complet

**User Story:** En tant qu'agriculteur, je veux un processus d'inscription guidé et complet qui me permet de configurer mon profil et mon portefeuille en 15 minutes, afin de commencer rapidement à utiliser la plateforme.

#### Acceptance Criteria

1. WHEN un agriculteur s'inscrit THEN le système SHALL demander une pièce d'identité officielle et une preuve de résidence
2. WHEN l'identité est vérifiée THEN la coopérative locale SHALL valider les informations
3. WHEN le profil agricole est créé THEN il SHALL inclure: superficie des terres, localisation, cultures actuelles et historiques, rendements des 3 dernières années, équipement et pratiques agricoles
4. WHEN la configuration technique est initiée THEN le système SHALL guider l'installation de HashPack Wallet
5. WHEN le wallet est configuré THEN le système SHALL demander le backup de la seed phrase
6. WHEN l'onboarding est terminé THEN le système SHALL effectuer une transaction test de 0.1$
7. WHEN toutes les étapes sont complétées THEN l'onboarding SHALL prendre maximum 15 minutes

### Requirement 6: Système de Notifications Programmées

**User Story:** En tant qu'agriculteur, je veux recevoir des rappels automatiques avant l'échéance de mon prêt par SMS, email et notification in-app, afin de ne jamais manquer une date de remboursement.

#### Acceptance Criteria

1. WHEN un prêt est actif THEN le système SHALL programmer automatiquement des notifications à J-7, J-3 et J-1
2. WHEN une notification programmée est due THEN elle SHALL être envoyée via SMS, email et in-app simultanément
3. WHEN une notification est envoyée THEN le système SHALL enregistrer la livraison dans les logs
4. WHEN une notification échoue THEN le système SHALL réessayer 3 fois avec un délai exponentiel
5. WHEN un utilisateur configure ses préférences THEN il SHALL pouvoir choisir les canaux de notification par type d'événement
6. WHEN le prix d'une culture change significativement THEN tous les agriculteurs concernés SHALL recevoir une notification
7. WHEN un remboursement est en retard THEN des notifications SHALL être envoyées quotidiennement

### Requirement 7: Score de Crédit et Historique

**User Story:** En tant qu'agriculteur, je veux que mon bon historique de remboursement améliore mon score de crédit, afin d'accéder à de meilleures conditions de prêt à l'avenir.

#### Acceptance Criteria

1. WHEN un agriculteur rembourse un prêt à temps THEN son score de crédit SHALL augmenter
2. WHEN un agriculteur a un retard de paiement THEN son score de crédit SHALL diminuer proportionnellement
3. WHEN un agriculteur a un bon score de crédit THEN ses limites de prêt SHALL être augmentées
4. WHEN un agriculteur a un excellent historique THEN ses taux d'intérêt SHALL être réduits
5. WHEN un agriculteur a un bon score THEN le processing de ses demandes SHALL être accéléré
6. WHEN le score de crédit est calculé THEN il SHALL prendre en compte: historique de remboursement, montants remboursés, retards, défauts, ancienneté
7. WHEN un agriculteur consulte son profil THEN il SHALL voir son score de crédit et les facteurs qui l'influencent

### Requirement 8: Rapports et Tableaux de Bord

**User Story:** En tant que coopérative, je veux un tableau de bord qui affiche la performance de mes agriculteurs et les risques agrégés, afin de mieux gérer mon portefeuille et identifier les problèmes rapidement.

#### Acceptance Criteria

1. WHEN un agriculteur consulte son dashboard THEN il SHALL voir: solde du prêt, intérêts accumulés, prochaine échéance, valeur du collatéral
2. WHEN un agriculteur termine un remboursement THEN il SHALL recevoir un reçu de transaction immédiat
3. WHEN le mois se termine THEN chaque agriculteur SHALL recevoir un rapport mensuel de position
4. WHEN une coopérative consulte son dashboard THEN elle SHALL voir: performance globale, alertes risques regroupés, rapports d'impact communautaire
5. WHEN un prêteur consulte son dashboard THEN il SHALL voir: performance du portefeuille, analyse de risque agrégée, impact social mesuré
6. WHEN un rapport est généré THEN il SHALL être disponible en PDF et CSV
7. WHEN des alertes de risque sont détectées THEN elles SHALL être affichées en temps réel sur le dashboard

### Requirement 9: Procédure de Liquidation Graduelle

**User Story:** En tant qu'agriculteur en difficulté, je veux avoir plusieurs opportunités de négociation avant que mon collatéral soit liquidé, afin de trouver une solution et éviter de perdre mes actifs.

#### Acceptance Criteria

1. WHEN un prêt atteint 45 jours de retard THEN le système SHALL initier la procédure de liquidation
2. WHEN la liquidation est initiée THEN le processus SHALL suivre: Jour 0-15 (période de grâce + notifications), Jour 16-30 (négociation restructuration), Jour 31-45 (procédure de liquidation), Jour 46+ (vente sur marché secondaire)
3. WHEN la phase de négociation commence THEN la coopérative SHALL être notifiée pour médiation
4. WHEN une restructuration est proposée THEN elle SHALL être documentée et signée par toutes les parties
5. WHEN la liquidation finale est déclenchée THEN les tokens SHALL être vendus sur le marché secondaire
6. WHEN la liquidation est complétée THEN un rapport détaillé SHALL être généré et partagé
7. WHEN des fonds sont récupérés THEN ils SHALL être distribués selon l'ordre: frais de liquidation (5%), prêteur (principal + intérêts), agriculteur (surplus éventuel)

### Requirement 10: Résolution des Litiges

**User Story:** En tant qu'utilisateur, je veux un processus clair de résolution des litiges avec plusieurs niveaux de médiation, afin de résoudre les conflits de manière équitable et transparente.

#### Acceptance Criteria

1. WHEN un litige est déclaré THEN il SHALL passer par 4 niveaux: Support MazaoChain, Coopérative partenaire, Comité d'arbitrage, Tribunaux compétents RDC
2. WHEN un litige est créé THEN toutes les décisions SHALL être enregistrées sur HCS
3. WHEN un litige progresse THEN la documentation SHALL être accessible aux parties concernées
4. WHEN un litige est ouvert THEN il SHALL être résolu dans un délai maximum de 30 jours
5. WHEN une décision est prise THEN elle SHALL être notifiée à toutes les parties
6. WHEN un litige est résolu THEN un rapport final SHALL être généré
7. WHEN un litige implique des fonds THEN ils SHALL être placés en escrow jusqu'à résolution
