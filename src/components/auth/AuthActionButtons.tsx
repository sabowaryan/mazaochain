'use client';

export function AuthActionButtons() {
  return (
    <>
      <button 
        onClick={() => window.location.reload()}
        className="px-3 py-2 text-sm bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
      >
        Recharger la page
      </button>
      
      <button 
        onClick={() => {
          // Simuler une mise à jour de profil
          console.log('Profile refresh triggered');
        }}
        className="px-3 py-2 text-sm bg-secondary-100 text-secondary-700 rounded-md hover:bg-secondary-200 transition-colors"
      >
        Actualiser le profil
      </button>
    </>
  );
}