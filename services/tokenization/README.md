# Service de Tokenisation Blockchain MazaoChain

Service externe Node.js qui traite automatiquement les tokenisations en attente sur la blockchain Hedera.

## 📋 Table des Matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Déploiement](#déploiement)
- [Monitoring](#monitoring)
- [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Ce service surveille la table `tokenization_records` dans Supabase et traite automatiquement les enregistrements avec le statut `pending` en créant des tokens sur la blockchain Hedera.

### Fonctionnalités

- ✅ **Polling automatique** des enregistrements en attente
- ✅ **Tokenisation sur Hedera** via le SDK JavaScript
- ✅ **Retry logic** avec backoff exponentiel
- ✅ **Circuit breaker** pour éviter les appels répétés en cas de panne
- ✅ **Logging détaillé** avec statistiques
- ✅ **Notifications** aux agriculteurs après tokenisation
- ✅ **Gestion des erreurs** robuste

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  Vercel API Route                   │
│  /api/evaluations/approve           │
│  - Approuve l'évaluation            │
│  - Crée tokenization_record         │
│  - Status: pending                  │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Supabase Database                  │
│  Table: tokenization_records        │
│  Status: pending                    │
└──────────────┬──────────────────────┘
               │
               │ Polling (30s)
               ↓
┌─────────────────────────────────────┐
│  Service de Tokenisation (Node.js)  │
│  - Récupère les pending             │
│  - Crée le token sur Hedera         │
│  - Met à jour status: completed     │
│  - Notifie l'agriculteur            │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Hedera Blockchain                  │
│  Smart Contract: MazaoTokenFactory  │
│  Fonction: createCropToken          │
└─────────────────────────────────────┘
```

---

## 📦 Prérequis

### Logiciels Requis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** (optionnel, pour déploiement conteneurisé)
- **Docker Compose** (optionnel)

### Comptes et Accès

- **Compte Hedera** (testnet ou mainnet)
  - Account ID (ex: `0.0.123456`)
  - Private Key
- **Supabase**
  - URL du projet
  - Service Role Key (avec permissions sur `tokenization_records`)
- **Smart Contract déployé**
  - Contract ID du MazaoTokenFactory

---

## 🚀 Installation

### Option 1: Installation Locale

```bash
# Cloner le dépôt
cd services/tokenization

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos configurations
nano .env

# Démarrer le service
npm start
```

### Option 2: Docker

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer .env avec vos configurations
nano .env

# Déployer avec Docker Compose
./deploy.sh
```

### Option 3: Systemd (Production)

```bash
# Installer le service systemd
sudo ./install-systemd.sh

# Démarrer le service
sudo systemctl start mazaochain-tokenization

# Vérifier le statut
sudo systemctl status mazaochain-tokenization
```

---

## ⚙️ Configuration

### Variables d'Environnement

Créez un fichier `.env` à partir de `.env.example`:

```bash
# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e...
HEDERA_NETWORK=testnet
MAZAO_TOKEN_FACTORY_CONTRACT_ID=0.0.6913792

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Service Configuration
POLL_INTERVAL_MS=30000
MAX_RETRIES=3
RETRY_DELAY_MS=5000
LOG_LEVEL=info
```

### Description des Variables

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `HEDERA_ACCOUNT_ID` | ID du compte Hedera opérateur | Requis |
| `HEDERA_PRIVATE_KEY` | Clé privée du compte Hedera | Requis |
| `HEDERA_NETWORK` | Réseau Hedera (`testnet` ou `mainnet`) | `testnet` |
| `MAZAO_TOKEN_FACTORY_CONTRACT_ID` | ID du smart contract MazaoTokenFactory | Requis |
| `SUPABASE_URL` | URL du projet Supabase | Requis |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase | Requis |
| `POLL_INTERVAL_MS` | Intervalle de polling en millisecondes | `30000` (30s) |
| `MAX_RETRIES` | Nombre maximum de tentatives en cas d'échec | `3` |
| `RETRY_DELAY_MS` | Délai de base entre les tentatives | `5000` (5s) |
| `LOG_LEVEL` | Niveau de logging (`error`, `warn`, `info`, `debug`) | `info` |

---

## 🚢 Déploiement

### Déploiement Local (Développement)

```bash
npm start
```

### Déploiement Docker

```bash
# Construire et démarrer
./deploy.sh

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Déploiement Production (Systemd)

```bash
# Installer
sudo ./install-systemd.sh

# Démarrer
sudo systemctl start mazaochain-tokenization

# Activer au démarrage
sudo systemctl enable mazaochain-tokenization

# Voir les logs
sudo journalctl -u mazaochain-tokenization -f
```

### Déploiement Cloud

#### AWS EC2

1. Lancer une instance EC2 (Ubuntu 22.04)
2. Installer Node.js 18+
3. Cloner le code
4. Utiliser systemd pour gérer le service

#### Google Cloud Run

```bash
# Construire l'image
docker build -t gcr.io/[PROJECT-ID]/mazaochain-tokenization .

# Pousser vers GCR
docker push gcr.io/[PROJECT-ID]/mazaochain-tokenization

# Déployer
gcloud run deploy mazaochain-tokenization \
  --image gcr.io/[PROJECT-ID]/mazaochain-tokenization \
  --platform managed \
  --region us-central1 \
  --set-env-vars-file .env
```

#### AWS Lambda

Le service peut être adapté pour AWS Lambda en utilisant un handler approprié.

---

## 📊 Monitoring

### Logs

Le service génère des logs détaillés avec:
- Timestamp
- Niveau (ERROR, WARN, INFO, DEBUG)
- Message
- Données contextuelles

**Exemple de logs:**

```
[2025-10-31T16:00:00.000Z] ℹ️ INFO: Service démarré avec succès
[2025-10-31T16:00:30.000Z] 🔔 INFO: 2 enregistrement(s) en attente
[2025-10-31T16:00:31.000Z] 🔄 INFO: Création du token pour l'évaluation abc123...
[2025-10-31T16:00:35.000Z] ✅ INFO: Token créé avec succès!
[2025-10-31T16:00:35.000Z] ℹ️ INFO: Transaction ID: 0.0.123456@1234567890.123
```

### Statistiques

Le service affiche périodiquement des statistiques:

```
📊 Statistiques du Service
   Temps de fonctionnement: 2h 15m 30s
   Enregistrements traités: 45
   Succès: 42
   Échecs: 3
   Taux de réussite: 93.33%
```

### Healthcheck

Pour Docker:

```bash
docker-compose ps
```

Pour systemd:

```bash
sudo systemctl status mazaochain-tokenization
```

---

## 🔧 Dépannage

### Le service ne démarre pas

**Vérifications:**

1. Variables d'environnement configurées
   ```bash
   cat .env
   ```

2. Dépendances installées
   ```bash
   npm install
   ```

3. Permissions correctes
   ```bash
   chmod +x deploy.sh
   ```

### Erreur "Cannot read properties of undefined (reading 'MAX_STRING_LENGTH')"

**Solution:** Cette erreur ne devrait PAS apparaître dans ce service car il fonctionne dans un environnement Node.js normal, pas dans Vercel.

Si elle apparaît quand même:
1. Vérifier la version de Node.js (>= 18)
2. Réinstaller les dépendances
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### Aucun enregistrement traité

**Vérifications:**

1. Connexion à Supabase
   ```bash
   # Vérifier les logs pour les erreurs de connexion
   ```

2. Enregistrements pending dans la DB
   ```sql
   SELECT * FROM tokenization_records WHERE status = 'pending';
   ```

3. Permissions RLS Supabase
   - Le service role key doit avoir accès à `tokenization_records`

### Erreurs de transaction Hedera

**Erreurs courantes:**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `INSUFFICIENT_TX_FEE` | Pas assez de HBAR | Ajouter des HBAR au compte |
| `INVALID_SIGNATURE` | Clé privée incorrecte | Vérifier `HEDERA_PRIVATE_KEY` |
| `CONTRACT_REVERT_EXECUTED` | Erreur dans le smart contract | Vérifier les paramètres |
| `TIMEOUT` | Réseau lent | Augmenter `MAX_RETRIES` |

### Logs détaillés

Activer le mode debug:

```bash
# Dans .env
LOG_LEVEL=debug
```

---

## 📚 Documentation Supplémentaire

- [Documentation Hedera SDK](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [Documentation Supabase](https://supabase.com/docs)
- [Guide de déploiement Docker](https://docs.docker.com/)
- [Guide systemd](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

---

## 🆘 Support

Pour toute question ou problème:

1. Consulter ce README
2. Vérifier les logs du service
3. Consulter la table `tokenization_records` dans Supabase
4. Contacter l'équipe de développement

---

## 📝 Licence

MIT License - MazaoChain Team

---

**Version:** 1.0.0  
**Dernière mise à jour:** 31 octobre 2025
