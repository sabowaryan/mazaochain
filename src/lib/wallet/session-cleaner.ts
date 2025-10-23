/**
 * Utility for cleaning invalid wallet sessions
 */

import { analyzeAddress, isValidForMirrorNode } from './address-utils';

export interface SessionCleanupResult {
    cleaned: boolean;
    reason?: string;
    originalSession?: any;
}

/**
 * Clean invalid sessions from localStorage
 */
export function cleanInvalidSessions(): SessionCleanupResult {
    try {
        const sessionData = localStorage.getItem('hedera_wallet_session');

        if (!sessionData) {
            return { cleaned: false, reason: 'No session found' };
        }

        const session = JSON.parse(sessionData);
        console.log('Found existing session:', session);

        // Check if session has required fields
        if (!session.accountId) {
            localStorage.removeItem('hedera_wallet_session');
            return {
                cleaned: true,
                reason: 'Missing accountId',
                originalSession: session
            };
        }

        // Analyze the address
        const addressInfo = analyzeAddress(session.accountId);
        console.log('Address analysis:', addressInfo);

        // Check for invalid address patterns
        const invalidPatterns = [
            session.accountId.startsWith('eip155:'),
            session.accountId.startsWith('hedera:'),
            session.accountId === 'eip155:295',
            session.accountId === 'eip155:296',
            session.accountId === 'hedera:testnet',
            session.accountId === 'hedera:mainnet',
            !isValidForMirrorNode(session.accountId) && addressInfo.type === 'unknown'
        ];

        if (invalidPatterns.some(pattern => pattern)) {
            localStorage.removeItem('hedera_wallet_session');
            return {
                cleaned: true,
                reason: `Invalid address format: ${session.accountId}`,
                originalSession: session
            };
        }

        // Check session age (older than 24 hours)
        if (session.timestamp) {
            const age = Date.now() - session.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (age > maxAge) {
                localStorage.removeItem('hedera_wallet_session');
                return {
                    cleaned: true,
                    reason: 'Session expired',
                    originalSession: session
                };
            }
        }

        return { cleaned: false, reason: 'Session is valid' };

    } catch (error) {
        console.error('Error during session cleanup:', error);
        // If we can't parse the session, remove it
        localStorage.removeItem('hedera_wallet_session');
        return {
            cleaned: true,
            reason: `Parse error: ${error}`,
            originalSession: null
        };
    }
}

/**
 * Clean all wallet-related data from localStorage
 */
export function cleanAllWalletData(): string[] {
    const keysToClean = [
        'hedera_wallet_session',
        'wallet_connection_state',
        'appkit_session',
        'walletconnect',
        'wc@2:client:0.3//session',
        'wc@2:core:0.3//keychain',
        'wc@2:core:0.3//messages',
        'wc@2:core:0.3//subscription',
        'wc@2:core:0.3//history',
        'wc@2:core:0.3//expirer',
        'wc@2:universal_provider:/optionalNamespaces',
        'wc@2:universal_provider:/namespaces',
        'wc@2:universal_provider:/sessionProperties'
    ];

    const cleanedKeys: string[] = [];

    keysToClean.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            cleanedKeys.push(key);
        }
    });

    // Also clean any keys that start with wallet-related prefixes
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
        if (key.startsWith('wc@') || 
            key.startsWith('wallet') || 
            key.startsWith('appkit') || 
            key.startsWith('reown') ||
            key.includes('walletconnect')) {
            localStorage.removeItem(key);
            if (!cleanedKeys.includes(key)) {
                cleanedKeys.push(key);
            }
        }
    });

    return cleanedKeys;
}

/**
 * Force clean and reset wallet service
 */
export async function forceResetWalletService(): Promise<void> {
    console.log("🔄 Force resetting wallet service...");
    
    // Clean all localStorage data
    const cleanedKeys = cleanAllWalletData();
    console.log("Cleaned localStorage keys:", cleanedKeys);
    
    // Try to get wallet service and force reset
    try {
        if (typeof window !== 'undefined') {
            // Dynamic import to avoid SSR issues
            const { hederaWalletService } = await import('./hedera-wallet');
            
            // Force reset AppKit
            if (typeof (hederaWalletService as any).forceResetAppKit === 'function') {
                await (hederaWalletService as any).forceResetAppKit();
            }
            
            // Cleanup the service
            if (typeof (hederaWalletService as any).cleanup === 'function') {
                await (hederaWalletService as any).cleanup();
            }
        }
    } catch (error) {
        console.warn("Could not reset wallet service:", error);
    }
    
    console.log("✅ Force reset completed");
}

/**
 * Get current session info for debugging
 */
export function getSessionInfo(): any {
    try {
        const sessionData = localStorage.getItem('hedera_wallet_session');
        if (!sessionData) return null;

        const session = JSON.parse(sessionData);
        const addressInfo = analyzeAddress(session.accountId || '');

        return {
            session,
            addressInfo,
            isValidForMirrorNode: isValidForMirrorNode(session.accountId || ''),
            age: session.timestamp ? Date.now() - session.timestamp : null,
            ageHours: session.timestamp ? (Date.now() - session.timestamp) / (1000 * 60 * 60) : null
        };
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
}