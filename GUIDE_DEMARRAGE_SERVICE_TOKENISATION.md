# 🚀 Guide de Démarrage Rapide - Service de Tokenisation

## ✅ Situation Actuelle

Votre application MazaoChain est maintenant **opérationnelle** avec:

1. ✅ **API Route fonctionnelle** - Les évaluations peuvent être approuvées
2. ✅ **Enregistrements dans la DB** - Les tokenisations sont enregistrées avec status `pending`
3. ✅ **Service de tokenisation prêt** - Code complet dans `services/tokenization/`

---

## 🎯 Prochaines Étapes

### Étape 1: Tester l'Approbation (MAINTENANT)

1. **Déployez sur Vercel** (automatique via GitHub)
2. **Testez l'approbation** d'une évaluation
3. **Vérifiez dans Supabase** que l'enregistrement est créé dans `tokenization_records`

**Résultat attendu:**
- ✅ Évaluation approuvée (status: `approved`)
- ✅ Enregistrement créé dans `tokenization_records` (status: `pending`)
- ✅ Notification envoyée à l'agriculteur

---

### Étape 2: Déployer le Service de Tokenisation (CETTE SEMAINE)

Vous avez **3 options** de déploiement:

#### Option A: Docker (RECOMMANDÉ - Plus Simple)

```bash
# Sur votre serveur (Ubuntu/Debian)
cd services/tokenization

# Copier et configurer .env
cp .env.example .env
nano .env  # Ajouter vos clés Hedera et Supabase

# Déployer
./deploy.sh

# Vérifier
docker-compose logs -f
```

**Prérequis:**
- Serveur Linux avec Docker installé
- Clés Hedera (Account ID + Private Key)
- Clé Supabase Service Role

#### Option B: Systemd (Production)

```bash
# Sur votre serveur Ubuntu
cd services/tokenization

# Installer
sudo ./install-systemd.sh

# Démarrer
sudo systemctl start mazaochain-tokenization

# Vérifier
sudo systemctl status mazaochain-tokenization
```

#### Option C: Cloud Run / Lambda

Consultez le README dans `services/tokenization/README.md`

---

### Étape 3: Configuration Requise

#### Variables d'Environnement

Créez un fichier `.env` avec:

```bash
# Hedera (TESTNET pour commencer)
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e...
HEDERA_NETWORK=testnet
MAZAO_TOKEN_FACTORY_CONTRACT_ID=0.0.6913792

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# Service (optionnel)
POLL_INTERVAL_MS=30000
LOG_LEVEL=info
```

#### Où trouver ces informations ?

**Hedera:**
1. Créer un compte sur [Hedera Portal](https://portal.hedera.com/)
2. Récupérer Account ID et Private Key
3. Ajouter des HBAR pour les frais de transaction

**Supabase:**
1. Dashboard Supabase → Settings → API
2. Copier `URL` et `service_role` key

---

## 📊 Flux Complet

```
1. Coopérative approuve évaluation
         ↓
2. API Route crée tokenization_record (pending)
         ↓
3. Service de tokenisation détecte (polling 30s)
         ↓
4. Service crée token sur Hedera
         ↓
5. Service met à jour status → completed
         ↓
6. Agriculteur reçoit notification
```

---

## 🧪 Test du Service

### Test 1: Vérifier que le service démarre

```bash
# Docker
docker-compose logs -f

# Systemd
sudo journalctl -u mazaochain-tokenization -f
```

**Logs attendus:**
```
✅ Configuration validée
✅ Client Hedera initialisé
✅ Service démarré avec succès!
📡 Polling des enregistrements en attente...
```

### Test 2: Créer une tokenisation test

1. Approuver une évaluation via l'interface
2. Vérifier dans Supabase:
   ```sql
   SELECT * FROM tokenization_records WHERE status = 'pending';
   ```
3. Attendre 30 secondes (intervalle de polling)
4. Vérifier les logs du service
5. Vérifier que le status est passé à `completed`

---

## 📋 Checklist de Déploiement

### Avant le Déploiement

- [ ] Compte Hedera créé (testnet)
- [ ] HBAR ajoutés au compte (minimum 10 HBAR)
- [ ] Smart contract MazaoTokenFactory déployé
- [ ] Clé Supabase Service Role récupérée
- [ ] Serveur Linux avec Docker installé (ou Node.js 18+)

### Déploiement

- [ ] Code cloné sur le serveur
- [ ] Fichier `.env` configuré
- [ ] Dépendances installées (`npm install`)
- [ ] Service démarré
- [ ] Logs vérifiés (pas d'erreurs)

### Après le Déploiement

- [ ] Test d'approbation d'évaluation
- [ ] Vérification dans `tokenization_records`
- [ ] Attente de la tokenisation (30s)
- [ ] Vérification du status `completed`
- [ ] Vérification de la transaction sur [HashScan](https://hashscan.io/testnet)

---

## 🆘 Problèmes Courants

### Le service ne démarre pas

**Vérifier:**
```bash
# Variables d'environnement
cat .env

# Logs d'erreur
docker-compose logs
# ou
sudo journalctl -u mazaochain-tokenization -n 50
```

### Aucun enregistrement traité

**Vérifier:**
1. Connexion Supabase (logs)
2. Enregistrements pending dans la DB
3. Permissions RLS Supabase

### Erreur Hedera

**Vérifier:**
1. Solde HBAR du compte
2. Clé privée correcte
3. Contract ID correct
4. Réseau (testnet vs mainnet)

---

## 📚 Documentation

- **README complet:** `services/tokenization/README.md`
- **Solution temporaire:** `SOLUTION_TEMPORAIRE_API_REST.md`
- **Architecture:** Voir les diagrammes dans les docs

---

## 🎉 Résultat Final

Une fois tout configuré, votre système sera **100% fonctionnel**:

1. ✅ Approbation d'évaluations
2. ✅ Tokenisation automatique sur Hedera
3. ✅ Notifications aux agriculteurs
4. ✅ Traçabilité complète
5. ✅ Monitoring et logs

**Temps estimé de mise en place:** 1-2 heures

---

## 💡 Conseils

1. **Commencez par testnet** - Ne passez en mainnet qu'après validation complète
2. **Surveillez les logs** - Les premières heures pour détecter les problèmes
3. **Testez avec une évaluation** - Avant de déployer en production
4. **Documentez vos clés** - Sauvegardez-les de manière sécurisée

---

**Besoin d'aide ?** Consultez le README ou contactez l'équipe de développement.

**Bonne chance ! 🚀**
