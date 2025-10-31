#!/bin/bash

# Script de déploiement du service de tokenisation MazaoChain

set -e

echo "🚀 Déploiement du service de tokenisation MazaoChain"
echo ""

# Vérifier que le fichier .env existe
if [ ! -f .env ]; then
    echo "❌ Erreur: Le fichier .env n'existe pas"
    echo "   Copiez .env.example vers .env et configurez les variables"
    exit 1
fi

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Erreur: Docker n'est pas installé"
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Erreur: Docker Compose n'est pas installé"
    exit 1
fi

echo "✅ Vérifications préliminaires passées"
echo ""

# Arrêter le service s'il est en cours d'exécution
echo "🛑 Arrêt du service existant..."
docker-compose down || true

# Construire l'image
echo ""
echo "🔨 Construction de l'image Docker..."
docker-compose build

# Démarrer le service
echo ""
echo "▶️  Démarrage du service..."
docker-compose up -d

# Attendre que le service démarre
echo ""
echo "⏳ Attente du démarrage du service..."
sleep 5

# Vérifier le statut
echo ""
echo "📊 Statut du service:"
docker-compose ps

# Afficher les logs
echo ""
echo "📋 Derniers logs:"
docker-compose logs --tail=20

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "Pour voir les logs en temps réel:"
echo "  docker-compose logs -f"
echo ""
echo "Pour arrêter le service:"
echo "  docker-compose down"
echo ""
echo "Pour redémarrer le service:"
echo "  docker-compose restart"
echo ""
