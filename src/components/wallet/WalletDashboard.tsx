'use client';

import React, { useState } from 'react';
import { WalletConnection } from './WalletConnection';
import { WalletBalance } from './WalletBalance';
import { WalletStatus } from './WalletStatus';
import { useWallet } from '@/hooks/useWallet';
import { useHapticFeedback } from '@/components/ui/HapticFeedback';
import {
    WalletIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
    WalletIcon as WalletIconSolid,
    CurrencyDollarIcon as CurrencyDollarIconSolid
} from '@heroicons/react/24/solid';

type WalletTab = 'connection' | 'balance' | 'analytics';

interface WalletDashboardProps {
    className?: string;
    defaultTab?: WalletTab;
}

export function WalletDashboard({
    className = '',
    defaultTab = 'connection'
}: WalletDashboardProps) {
    const { isConnected } = useWallet();
    const { triggerHaptic } = useHapticFeedback();
    const [activeTab, setActiveTab] = useState<WalletTab>(defaultTab);

    const tabs: Array<{
        id: WalletTab;
        label: string;
        icon: any;
        iconSolid: any;
        component: React.ReactNode;
        disabled?: boolean;
    }> = [
            {
                id: 'connection',
                label: 'Connexion',
                icon: WalletIcon,
                iconSolid: WalletIconSolid,
                component: <WalletConnection showBalances={false} />
            },
            {
                id: 'balance',
                label: 'Soldes',
                icon: CurrencyDollarIcon,
                iconSolid: CurrencyDollarIconSolid,
                component: <WalletBalance variant="cards" />,
                disabled: !isConnected
            },
            {
                id: 'analytics',
                label: 'Analytics',
                icon: ChartBarIcon,
                iconSolid: ChartBarIcon,
                component: (
                    <div className="text-center py-12 text-gray-500">
                        <ChartBarIcon className="w-12 h-12 mx-auto mb-3" />
                        <p>Analytics à venir...</p>
                    </div>
                ),
                disabled: !isConnected
            }
        ];

    return (
        <div className={`w-full max-w-6xl mx-auto ${className}`}>
            {/* Header with Status */}
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Wallet Dashboard
                        </h2>
                        <WalletStatus variant="detailed" />
                    </div>
                    <div className="text-right">
                        {isConnected && (
                            <WalletBalance variant="compact" showRefresh={false} />
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const IconComponent = isActive ? tab.iconSolid : tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    if (!tab.disabled) {
                                        triggerHaptic('light');
                                        setActiveTab(tab.id);
                                    }
                                }}
                                disabled={tab.disabled}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : tab.disabled
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-600 hover:text-emerald-600 hover:bg-white/50'
                                    }`}
                            >
                                <IconComponent className="w-5 h-5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {tabs.find(tab => tab.id === activeTab)?.component}
            </div>
        </div>
    );
}