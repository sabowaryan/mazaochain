# MazaoChain MVP

Plateforme de prêt décentralisée pour les agriculteurs en République Démocratique du Congo (RDC).

## 🎯 Démonstration

### Comptes de test disponibles

Pour tester l'application, utilisez les comptes de démonstration suivants :

#### 👨‍🌾 Agriculteur
- **Email**: `farmer@mazaochain.com`
- **Mot de passe**: `demo123`
- **Profil**: Jean Mukendi, 5.5 hectares à Kinshasa
- **Statut**: Compte validé avec évaluations de cultures

#### 🏢 Coopérative
- **Email**: `cooperative@mazaochain.com`
- **Mot de passe**: `demo123`
- **Profil**: COPAKI Kinshasa, 1 membre
- **Statut**: Compte validé avec permissions d'approbation

#### 💰 Prêteur
- **Email**: `lender@mazaochain.com`
- **Mot de passe**: `demo123`
- **Profil**: FinanceRDC, 50,000 USDC disponibles
- **Statut**: Compte validé avec fonds disponibles

### Données de test incluses
- ✅ Évaluations de cultures (manioc et café)
- ✅ Prêt actif de 5,000 USDC
- ✅ Transactions blockchain simulées
- ✅ Notifications et préférences configurées

### Configuration requise
1. **Migrations appliquées** : `npx supabase db push --linked` ✅
2. **Comptes auth à créer** : Via l'interface Supabase (voir [MANUAL_AUTH_SETUP.md](./MANUAL_AUTH_SETUP.md))
3. **Données de test** : Automatiquement créées après les comptes auth
4. **Test de connexion** : Utiliser les identifiants ci-dessus

### Scripts utiles
- `scripts/apply-demo-data.ps1` - Script PowerShell pour appliquer les données
- `scripts/seed-demo-data.sql` - Script SQL pour créer les données de test

## 🚀 Technologies

- **Frontend**: Next.js 15 avec TypeScript
- **Styling**: Tailwind CSS 4 avec design system personnalisé
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth avec système temps réel
- **Blockchain**: Hedera Hashgraph (Testnet)
- **Wallet**: HashPack
- **Internationalisation**: Support FR/EN/LN

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte Supabase
- Compte Hedera (testnet)

## 🛠️ Installation

1. Cloner le repository
ash
git clone <reposi
mvp
```

2. Installer les dépendances
```bash
 install
```

3. Configurer les variabnt
```bash
cp .env.local.example .env
```

local` :
- Configuration Supabase
- Confira
- Configuraack
- Ans

4. Lancer le serveur de développt
```bash
npm run dev
```

## 🏗️ Structure du projet

```
src/
├── app/   r)
├──ables
I de base
│   ├── auth/              # Composants d'authentification

│   ├── cooperative/ves
 prêteurs
├──nalisés
├── ons
│   ├── supabase/          # Configuration Supabase
│   ├── hedera/            # Configuration Hedera
│   ├── config/            # Variables d'envnt
│   └── utils/             # Fonctions utis
└── types/                 # Définitionscript
```

## 🔧 Scripts disponibles

- `npm run dev` - Lancer le serveur de développement
- `npm run build` - Construire l'application pour la production
- `npm run start` - Lancer l'application en production
- `npm run lint` - Lancer ESLint
- `npx supabase db push` - Appliquer les migrations (avec Docker)

## 🌍 Variables d'environnement

Voir `.env.local.example` pour la liste complète des variables.

### Variables essentielles :
- `NEXT_PUBLIC_SUPABASE_URL` - URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé publique Supabase
- `NEXT_PUBLIC_HEDERA_ACCOUNT_ID` - ID du compte Hedera
- `NEXT_PUBLIC_HEDERA_PRIVATE_KEY` - Clé privée Hedera (testnet)

## 🎨 Fonctionnalités

### Authentification en temps réel
- ✅ Connexion/déconnexion automatique
- ✅ Notifications en temps réel
- ✅ Protection des routes par rôles
- ✅ Gestion des sessions sécurisée

### Interface multilingue
- ✅ Français (par défaut)
- ✅ Anglais
- ✅ Lingala
- ✅ Routage automatique selon la langue

### Smart Contracts
- ✅ Déployés sur Hedera Testnet
- ✅ MazaoTokenFactory: `0.0.6913902`
- ✅ LoanManager: `0.0.6913910`
- ✅ Tests complets validés

### Design System
- ✅ Logo adaptatif MazaoChain
- ✅ Palette de couleurs cohérente
- ✅ Composants réutilisables
- ✅ Mode sombre supporté

## 📚 Documentation

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Hedera](https://docs.hedera.com/)
- [Documentation Next.js](https://nextjs.org/docs)
- [Système d'authentification](./REALTIME_AUTH_SYSTEM.md)
- [Système de logo](./src/components/ui/Logo.md)

## 🚀 Déploiement

### Base de données
1. Créer un projet Supabase
2. Configurer les variables d'environnement
3. Appliquer les migrations : `npx supabase db push`
4. Les comptes de démonstration seront créés automatiquement

### Application
1. Déployer sur Vercel/Netlify
2. Configurer les variables d'environnement de production
3. Tester avec les comptes de démonstration

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.