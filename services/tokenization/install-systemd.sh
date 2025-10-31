#!/bin/bash

# Script d'installation du service systemd pour MazaoChain Tokenization

set -e

echo "🔧 Installation du service MazaoChain Tokenization avec systemd"
echo ""

# Vérifier les permissions root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté avec sudo"
    exit 1
fi

# Créer le répertoire de destination
echo "📁 Création du répertoire /opt/mazaochain/services/tokenization..."
mkdir -p /opt/mazaochain/services/tokenization

# Copier les fichiers
echo "📋 Copie des fichiers..."
cp -r * /opt/mazaochain/services/tokenization/

# Créer le répertoire de logs
echo "📝 Création du répertoire de logs..."
mkdir -p /var/log/mazaochain
chown ubuntu:ubuntu /var/log/mazaochain

# Installer les dépendances
echo "📦 Installation des dépendances npm..."
cd /opt/mazaochain/services/tokenization
npm ci --only=production

# Copier le fichier de service systemd
echo "⚙️  Installation du service systemd..."
cp mazaochain-tokenization.service /etc/systemd/system/

# Recharger systemd
echo "🔄 Rechargement de systemd..."
systemctl daemon-reload

# Activer le service
echo "✅ Activation du service..."
systemctl enable mazaochain-tokenization.service

echo ""
echo "✅ Installation terminée!"
echo ""
echo "Pour démarrer le service:"
echo "  sudo systemctl start mazaochain-tokenization"
echo ""
echo "Pour voir le statut:"
echo "  sudo systemctl status mazaochain-tokenization"
echo ""
echo "Pour voir les logs:"
echo "  sudo journalctl -u mazaochain-tokenization -f"
echo ""
echo "Pour arrêter le service:"
echo "  sudo systemctl stop mazaochain-tokenization"
echo ""
