'use client';

import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useTranslations } from '@/components/TranslationProvider';

export function OfflineSyncStatus() {
  const { isOnline, isSyncing, pendingCount, handleSync } = useOfflineSync();
  const t = useTranslations('pwa');

  // Don't show if online and no pending data
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isSyncing ? (
            <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
          <div>
            <p className="text-sm font-medium text-blue-900">
              {isSyncing 
                ? t('syncingData') || 'Synchronisation des données...'
                : pendingCount > 0 
                  ? `${pendingCount} ${pendingCount === 1 ? 'élément en attente' : 'éléments en attente'}`
                  : t('syncComplete') || 'Synchronisation terminée'}
            </p>
            {!isOnline && (
              <p className="text-xs text-blue-700 mt-1">
                Les données seront synchronisées automatiquement lors de la reconnexion
              </p>
            )}
          </div>
        </div>
        
        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            onClick={handleSync}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Synchroniser maintenant
          </button>
        )}
      </div>
    </div>
  );
}
