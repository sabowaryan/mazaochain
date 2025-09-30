// Suppresseur d'erreurs de source map pour le développement
export function suppressSourceMapErrors() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Supprimer les erreurs de source map dans la console
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Ignorer les erreurs de source map connues
      if (
        message.includes('Erreur dans les liens source') ||
        message.includes('Error: URL constructor:') ||
        message.includes('request failed with status 404') ||
        message.includes('installHook.js.map') ||
        message.includes('wasm:http://localhost') ||
        message.includes('WebAssembly.Module')
      ) {
        return;
      }
      
      originalError.apply(console, args);
    };

    // Supprimer les erreurs de source map dans les DevTools
    window.addEventListener('error', (event) => {
      if (
        event.message?.includes('source map') ||
        event.filename?.includes('.map') ||
        event.filename?.includes('wasm:')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    });

    // Supprimer les erreurs de ressources manquantes
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason?.toString() || '';
      if (
        reason.includes('source map') ||
        reason.includes('404') ||
        reason.includes('installHook.js.map')
      ) {
        event.preventDefault();
      }
    });
  }
}

// Auto-initialisation
if (typeof window !== 'undefined') {
  suppressSourceMapErrors();
}