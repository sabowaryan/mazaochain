# Requirements Document

## Introduction

Ce spec vise à auditer, vérifier et corriger l'implémentation existante du MVP MazaoChain. L'objectif n'est pas de créer de nouvelles fonctionnalités, mais de s'assurer que tout ce qui a été développé fonctionne correctement, est bien intégré, et que rien ne manque. Le focus est sur la qualité, la cohérence et la complétude de l'implémentation actuelle.

## Requirements

### Requirement 1

**User Story:** En tant que développeur, je veux auditer l'intégration de l'authentification et des rôles utilisateurs, afin de m'assurer que le système de permissions fonctionne correctement sur toutes les pages et routes.

#### Acceptance Criteria

1. WHEN l'audit de l'authentification est effectué THEN le système SHALL vérifier que tous les fichiers d'authentification (middleware, hooks, contexts) sont cohérents
2. WHEN les routes protégées sont testées THEN le système SHALL confirmer que chaque route vérifie correctement les rôles utilisateurs
3. WHEN les composants de navigation sont inspectés THEN le système SHALL vérifier que les menus s'adaptent correctement selon le rôle de l'utilisateur
4. IF des incohérences sont trouvées THEN le système SHALL les corriger sans créer de nouveaux fichiers inutiles
5. WHEN l'intégration Supabase Auth est vérifiée THEN le système SHALL confirmer que les sessions sont gérées correctement

### Requirement 2

**User Story:** En tant que développeur, je veux vérifier l'intégration du wallet HashPack sur toutes les pages concernées, afin de m'assurer que la connexion wallet fonctionne de manière cohérente.

#### Acceptance Criteria

1. WHEN l'intégration HashPack est auditée THEN le système SHALL vérifier que le contexte wallet est accessible partout où nécessaire
2. WHEN les composants utilisant le wallet sont inspectés THEN le système SHALL confirmer qu'ils gèrent correctement les états de connexion/déconnexion
3. WHEN les transactions blockchain sont testées THEN le système SHALL vérifier que les erreurs sont gérées proprement
4. IF des composants dupliquent la logique wallet THEN le système SHALL consolider le code dans les hooks/contexts existants
5. WHEN l'affichage des balances est vérifié THEN le système SHALL confirmer que les montants sont formatés correctement

### Requirement 3

**User Story:** En tant que développeur, je veux auditer les pages et interfaces utilisateur, afin de m'assurer qu'elles sont cohérentes, accessibles et fonctionnelles.

#### Acceptance Criteria

1. WHEN les pages du dashboard sont inspectées THEN le système SHALL vérifier que toutes les routes existent et sont accessibles
2. WHEN les formulaires sont testés THEN le système SHALL confirmer que la validation fonctionne correctement
3. WHEN l'interface multilingue est vérifiée THEN le système SHALL confirmer que Lingala et Français sont bien supportés
4. IF des pages manquent ou sont incomplètes THEN le système SHALL les compléter en modifiant l'existant
5. WHEN le responsive design est testé THEN le système SHALL vérifier que toutes les pages fonctionnent sur mobile

### Requirement 4

**User Story:** En tant que développeur, je veux vérifier l'intégration des smart contracts avec le frontend, afin de m'assurer que toutes les fonctions blockchain sont correctement appelées.

#### Acceptance Criteria

1. WHEN les contrats déployés sont inspectés THEN le système SHALL vérifier que les adresses et ABIs sont correctement configurés
2. WHEN les fonctions de tokenisation sont testées THEN le système SHALL confirmer que le minting fonctionne correctement
3. WHEN le système de prêts est vérifié THEN le système SHALL confirmer que les calculs de collatéral sont exacts
4. IF des fonctions de contrat ne sont pas utilisées THEN le système SHALL les intégrer dans l'interface
5. WHEN les transactions sont auditées THEN le système SHALL vérifier que les confirmations sont affichées à l'utilisateur

### Requirement 5

**User Story:** En tant que développeur, je veux auditer le système d'évaluation des cultures, afin de m'assurer que les calculs, la génération de PDF et l'historique fonctionnent correctement.

#### Acceptance Criteria

1. WHEN le formulaire d'évaluation est testé THEN le système SHALL vérifier que tous les champs requis sont validés
2. WHEN les calculs de valeur sont vérifiés THEN le système SHALL confirmer que la formule (superficie × rendement × prix) est correcte
3. WHEN la génération de PDF est testée THEN le système SHALL confirmer que les rapports sont créés avec toutes les données
4. IF l'historique des évaluations n'est pas affiché THEN le système SHALL ajouter cette fonctionnalité
5. WHEN l'approbation coopérative est vérifiée THEN le système SHALL confirmer que le workflow fonctionne

### Requirement 6

**User Story:** En tant que développeur, je veux vérifier le système de gestion des prêts, afin de m'assurer que la création, l'approbation, le décaissement et le remboursement fonctionnent de bout en bout.

#### Acceptance Criteria

1. WHEN le formulaire de demande de prêt est testé THEN le système SHALL vérifier que le calcul du collatéral (200%) est correct
2. WHEN le workflow d'approbation est vérifié THEN le système SHALL confirmer que les coopératives peuvent approuver/rejeter
3. WHEN le décaissement est testé THEN le système SHALL confirmer que les USDC sont transférés correctement
4. WHEN le remboursement est vérifié THEN le système SHALL confirmer que le collatéral est libéré automatiquement
5. IF des étapes du workflow sont manquantes THEN le système SHALL les implémenter

### Requirement 7

**User Story:** En tant que développeur, je veux auditer les interfaces spécifiques aux coopératives, afin de m'assurer qu'elles peuvent valider les agriculteurs et approuver les prêts efficacement.

#### Acceptance Criteria

1. WHEN le dashboard coopérative est inspecté THEN le système SHALL vérifier que toutes les demandes en attente sont affichées
2. WHEN les actions de validation sont testées THEN le système SHALL confirmer que les statuts sont mis à jour correctement
3. WHEN les notifications sont vérifiées THEN le système SHALL confirmer que les coopératives reçoivent les alertes
4. IF l'interface manque des fonctionnalités THEN le système SHALL les ajouter sans créer de nouveaux fichiers
5. WHEN l'historique des validations est vérifié THEN le système SHALL confirmer qu'il est accessible

### Requirement 8

**User Story:** En tant que développeur, je veux vérifier l'interface des prêteurs institutionnels, afin de m'assurer qu'ils peuvent voir les opportunités et investir correctement.

#### Acceptance Criteria

1. WHEN le dashboard prêteur est inspecté THEN le système SHALL vérifier que les opportunités de prêt sont listées
2. WHEN les métriques de risque sont vérifiées THEN le système SHALL confirmer que les calculs sont affichés
3. WHEN l'investissement est testé THEN le système SHALL confirmer que les fonds sont mis en escrow
4. WHEN la distribution des intérêts est vérifiée THEN le système SHALL confirmer qu'elle est automatique
5. IF des fonctionnalités manquent THEN le système SHALL les implémenter

### Requirement 9

**User Story:** En tant que développeur, je veux auditer la gestion des erreurs et la validation, afin de m'assurer que l'application gère gracieusement tous les cas d'erreur.

#### Acceptance Criteria

1. WHEN les erreurs blockchain sont testées THEN le système SHALL vérifier qu'elles sont affichées en Lingala/Français
2. WHEN les validations de formulaire sont vérifiées THEN le système SHALL confirmer que tous les champs sont validés
3. WHEN les erreurs réseau sont simulées THEN le système SHALL confirmer que l'application ne crash pas
4. IF des erreurs ne sont pas gérées THEN le système SHALL ajouter la gestion appropriée
5. WHEN les messages d'erreur sont inspectés THEN le système SHALL confirmer qu'ils sont clairs et utiles

### Requirement 10

**User Story:** En tant que développeur, je veux vérifier l'intégration de la base de données Supabase, afin de m'assurer que toutes les tables, relations et politiques RLS sont correctes.

#### Acceptance Criteria

1. WHEN le schéma de base de données est inspecté THEN le système SHALL vérifier que toutes les tables nécessaires existent
2. WHEN les relations entre tables sont vérifiées THEN le système SHALL confirmer que les foreign keys sont correctes
3. WHEN les politiques RLS sont testées THEN le système SHALL confirmer que les permissions sont appropriées
4. IF des migrations manquent THEN le système SHALL les créer
5. WHEN les requêtes sont auditées THEN le système SHALL vérifier qu'elles sont optimisées

### Requirement 11

**User Story:** En tant que développeur, je veux créer des tests automatisés pour les fonctionnalités critiques, afin de garantir la stabilité de l'application.

#### Acceptance Criteria

1. WHEN les tests sont créés THEN le système SHALL couvrir les workflows critiques (auth, prêts, tokenisation)
2. WHEN les tests sont exécutés THEN le système SHALL confirmer que tous les tests passent
3. WHEN les smart contracts sont testés THEN le système SHALL vérifier toutes les fonctions principales
4. IF des tests échouent THEN le système SHALL corriger les bugs identifiés
5. WHEN la couverture de code est mesurée THEN le système SHALL viser au moins 70% de couverture

### Requirement 12

**User Story:** En tant que développeur, je veux vérifier la configuration PWA et le responsive design, afin de m'assurer que l'application fonctionne parfaitement sur mobile.

#### Acceptance Criteria

1. WHEN la configuration PWA est inspectée THEN le système SHALL vérifier que le manifest et service worker sont corrects
2. WHEN l'application est testée sur mobile THEN le système SHALL confirmer que toutes les pages sont responsive
3. WHEN l'installation PWA est testée THEN le système SHALL confirmer que le prompt fonctionne
4. IF des problèmes de responsive sont trouvés THEN le système SHALL les corriger
5. WHEN les performances mobiles sont mesurées THEN le système SHALL vérifier que les temps de chargement sont acceptables
