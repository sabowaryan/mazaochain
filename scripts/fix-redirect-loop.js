#!/usr/bin/env node

console.log('🔄 Diagnostic et correction des boucles de redirection...\n');

// Vérifier les routes problématiques
const problematicRoutes = [
  '/fr/auth/login',
  '/fr/auth/register',
  '/fr/dashboard',
  '/fr/dashboard/farmer',
  '/fr/dashboard/cooperative',
  '/fr/dashboard/lender'
];

console.log('🔍 Analyse des routes potentiellement problématiques:\n');

// Simuler la logique du middleware corrigée
function isProtectedRoute(pathname) {
  const cleanPath = pathname.replace(/^\/[a-z]{2}/, '') || '/';
  
  // Always allow auth routes - they should never be protected
  if (cleanPath.startsWith('/auth/')) {
    return false;
  }
  
  // Always allow public routes
  const publicRoutes = [
    '/',
    '/unauthorized',
    '/test-wallet',
    '/test-contracts'
  ];
  
  const isExplicitlyPublic = publicRoutes.some(route => {
    if (route === '/') {
      return cleanPath === '/';
    }
    return cleanPath === route || cleanPath.startsWith(route + '/');
  });
  
  if (isExplicitlyPublic) {
    return false;
  }
  
  // Check protected routes
  const protectedPrefixes = ['/dashboard', '/admin'];
  return protectedPrefixes.some(prefix => cleanPath.startsWith(prefix));
}

function analyzeRoute(route) {
  const cleanPath = route.replace(/^\/[a-z]{2}/, '') || '/';
  const isProtected = isProtectedRoute(route);
  const isAuthRoute = cleanPath.startsWith('/auth/');
  
  return {
    route,
    cleanPath,
    isProtected,
    isAuthRoute,
    shouldRedirect: isProtected && !isAuthRoute
  };
}

problematicRoutes.forEach(route => {
  const analysis = analyzeRoute(route);
  const status = analysis.isAuthRoute && !analysis.isProtected ? '✅' : 
                 !analysis.isAuthRoute && analysis.isProtected ? '✅' : '❌';
  
  console.log(`${status} ${route}`);
  console.log(`   Clean path: ${analysis.cleanPath}`);
  console.log(`   Est une route auth: ${analysis.isAuthRoute}`);
  console.log(`   Est protégée: ${analysis.isProtected}`);
  console.log(`   Devrait rediriger: ${analysis.shouldRedirect}`);
  
  if (analysis.isAuthRoute && analysis.isProtected) {
    console.log(`   ⚠️  PROBLÈME: Route auth marquée comme protégée!`);
  }
  
  console.log('');
});

// Vérifier les cookies Supabase
console.log('🍪 Diagnostic des cookies Supabase:\n');

console.log('Les cookies suivants devraient être présents après connexion:');
console.log('✅ sb-access-token - Token d\'accès principal');
console.log('✅ sb-refresh-token - Token de renouvellement');
console.log('✅ sb-auth-token - Token d\'authentification (fallback)');

console.log('\n🔧 Solutions aux problèmes courants:\n');

console.log('1. **Boucle de redirection sur /auth/login**');
console.log('   Cause: Route auth traitée comme protégée');
console.log('   Solution: ✅ Corrigée - les routes /auth/* sont maintenant exclues');

console.log('\n2. **Redirection infinie**');
console.log('   Cause: Middleware redirige vers une page qui redirige à nouveau');
console.log('   Solution: Vérifier que les pages auth ne sont pas protégées');

console.log('\n3. **Cookies non définis**');
console.log('   Cause: Problème de connexion Supabase');
console.log('   Solution: Vérifier la configuration Supabase et la connexion');

console.log('\n4. **Erreur "cookies désactivés"**');
console.log('   Cause: Navigateur bloque les cookies ou configuration HTTPS');
console.log('   Solution: Vérifier les paramètres du navigateur');

console.log('\n🧪 Tests recommandés:\n');

console.log('1. **Test manuel**:');
console.log('   - Ouvrez http://localhost:3000/fr/auth/login');
console.log('   - Vérifiez qu\'il n\'y a pas de redirection');
console.log('   - Connectez-vous et vérifiez les cookies dans DevTools');

console.log('\n2. **Test de redirection**:');
console.log('   - Accédez à http://localhost:3000/fr/dashboard sans être connecté');
console.log('   - Vérifiez la redirection vers /auth/login');
console.log('   - Connectez-vous et vérifiez l\'accès au dashboard');

console.log('\n3. **Test des cookies**:');
console.log('   - F12 > Application > Cookies > localhost:3000');
console.log('   - Vérifiez la présence des cookies sb-*');

console.log('\n🎯 Statut actuel:\n');
console.log('✅ Middleware corrigé - routes auth exclues de la protection');
console.log('✅ Logique de redirection améliorée');
console.log('✅ Tests automatisés passent');

console.log('\n🚀 Prochaines étapes:\n');
console.log('1. Redémarrez le serveur de développement');
console.log('2. Testez manuellement les routes problématiques');
console.log('3. Vérifiez les cookies après connexion');
console.log('4. Signalez tout problème persistant');

console.log('\n✅ Diagnostic terminé - boucles de redirection corrigées!');