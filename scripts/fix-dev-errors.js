#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔧 Correction des erreurs de développement...');

// Nettoyer le cache Next.js
console.log('🧹 Nettoyage du cache Next.js...');
try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('✅ Cache Next.js nettoyé');
  }
} catch (error) {
  console.warn('⚠️  Impossible de nettoyer le cache Next.js:', error.message);
}

// Nettoyer le cache TypeScript
console.log('🧹 Nettoyage du cache TypeScript...');
try {
  if (fs.existsSync('tsconfig.tsbuildinfo')) {
    fs.unlinkSync('tsconfig.tsbuildinfo');
    console.log('✅ Cache TypeScript nettoyé');
  }
} catch (error) {
  console.warn('⚠️  Impossible de nettoyer le cache TypeScript:', error.message);
}

// Vérifier les variables d'environnement
console.log('🔍 Vérification des variables d\'environnement...');
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!envContent.includes('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID')) {
    console.log('⚠️  Variable NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID manquante');
    console.log('💡 Veuillez obtenir un Project ID sur https://cloud.walletconnect.com/');
  } else {
    console.log('✅ Variables d\'environnement vérifiées');
  }
} else {
  console.log('⚠️  Fichier .env.local non trouvé');
}

// Réinstaller les dépendances si nécessaire
console.log('📦 Vérification des dépendances...');
try {
  execSync('npm list @walletconnect/modal', { stdio: 'ignore' });
  console.log('✅ Dépendances WalletConnect présentes');
} catch (error) {
  console.log('🔄 Réinstallation des dépendances...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dépendances réinstallées');
  } catch (installError) {
    console.error('❌ Erreur lors de la réinstallation:', installError.message);
  }
}

console.log('\n🎉 Correction terminée !');
console.log('💡 Conseils pour éviter ces erreurs :');
console.log('   1. Configurez NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID dans .env.local');
console.log('   2. Redémarrez le serveur de développement avec npm run dev');
console.log('   3. Videz le cache du navigateur si nécessaire');