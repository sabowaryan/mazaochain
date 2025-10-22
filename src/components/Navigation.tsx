'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/components/TranslationProvider'
import { Button } from '@/components/ui/Button'
import { WalletStatus } from '@/components/wallet/WalletStatus'
import { EnhancedWalletStatus } from '@/components/wallet/EnhancedWalletStatus'
import { AppKitWalletButton } from '@/components/wallet/AppKitWalletButton'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { NavbarLogo } from '@/components/ui/Logo'
import { AuthStatus } from '@/components/auth/AuthStatus'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ROUTES, USER_ROLES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  HomeIcon,
  UserIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  WalletIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid,
  BellIcon as BellIconSolid
} from '@heroicons/react/24/solid'

export function Navigation() {
  const { 
    user, 
    profile, 
    signOut, 
    isAuthenticated, 
    isValidated,
    loading,
    initialized 
  } = useAuth()
  const t = useTranslations('navigation')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const getDashboardRoute = () => {
    if (!profile) return ROUTES.HOME
    
    switch (profile.role) {
      case USER_ROLES.AGRICULTEUR:
        return ROUTES.DASHBOARD.FARMER
      case USER_ROLES.COOPERATIVE:
        return ROUTES.DASHBOARD.COOPERATIVE
      case USER_ROLES.PRETEUR:
        return ROUTES.DASHBOARD.LENDER
      case USER_ROLES.ADMIN:
        return ROUTES.DASHBOARD.ADMIN
      default:
        return ROUTES.HOME
    }
  }

  const getNavigationItems = () => {
    if (!isAuthenticated || !profile) return []

    const baseItems = [
      {
        label: t('dashboard'),
        href: getDashboardRoute(),
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      }
    ]

    // Add role-specific items
    if (profile.role === USER_ROLES.ADMIN) {
      baseItems.push({
        label: 'Admin',
        href: '/admin',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      })
    }

    return baseItems
  }

  const handleSignOut = async () => {
    setIsUserMenuOpen(false)
    await signOut()
  }

  return (
    <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={ROUTES.HOME} className="flex-shrink-0">
              <NavbarLogo />
            </Link>
          </div>

          {/* Navigation Items - Desktop */}
          <div className="hidden lg:flex items-center space-x-1">
            {isAuthenticated && initialized && (
              <>
                {getNavigationItems().map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50"
                  >
                    <HomeIcon className="w-4 h-4 mr-2 text-gray-500" />
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {/* Loading State */}
            {!initialized && (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-500">
                  {t('loading')}
                </span>
              </div>
            )}

            {/* Authenticated State */}
            {initialized && isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Notifications */}
                <NotificationBell />

                {/* Wallet Connection */}
                <div className="hidden xl:block">
                  <EnhancedWalletStatus 
                    variant="dropdown" 
                    showBalance={true} 
                    showNetwork={true} 
                  />
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 p-2 hover:bg-emerald-50 transition-all duration-200 border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm font-semibold">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-gray-900 font-medium text-sm">
                        {user?.email?.split('@')[0] || 'Utilisateur'}
                      </p>
                      <p className="text-gray-500 text-xs capitalize">
                        {profile?.role === 'agriculteur' ? 'Agriculteur' : 
                         profile?.role === 'cooperative' ? 'Coopérative' : 
                         profile?.role === 'preteur' ? 'Prêteur' : 'Utilisateur'}
                      </p>
                    </div>
                    <ChevronDownIcon className={cn(
                      "w-4 h-4 text-gray-500 transition-transform duration-200",
                      isUserMenuOpen && "rotate-180"
                    )} />
                  </button>

                  {/* Dropdown Menu amélioré */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200/50 backdrop-blur-sm">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white text-lg font-semibold">
                              {user?.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user?.email?.split('@')[0] || 'Utilisateur'}
                            </p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            {profile && (
                              <p className="text-xs text-emerald-600 capitalize font-medium">
                                {profile.role === 'agriculteur' ? 'Agriculteur' : 
                                 profile.role === 'cooperative' ? 'Coopérative' : 
                                 profile.role === 'preteur' ? 'Prêteur' : 'Utilisateur'} • {isValidated ? 'Validé' : 'En attente'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        {/* Mobile Navigation Items */}
                        <div className="lg:hidden space-y-1 mb-2">
                          {getNavigationItems().map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            >
                              <HomeIcon className="w-4 h-4" />
                              {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-gray-100 my-2"></div>
                        </div>

                        {/* Profile Link */}
                        <Link
                          href={`${getDashboardRoute()}/profile`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <UserIcon className="w-4 h-4" />
                          {t('profile') || 'Mon profil'}
                        </Link>

                        {/* Notifications */}
                        <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                          <BellIcon className="w-4 h-4" />
                          Notifications
                        </button>

                        {/* Settings */}
                        <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                          <Cog6ToothIcon className="w-4 h-4" />
                          Paramètres
                        </button>

                        {/* Mobile Wallet */}
                        <div className="xl:hidden px-4 py-2 mt-2">
                          <EnhancedWalletStatus variant="detailed" showBalance={true} showNetwork={true} />
                        </div>

                        <div className="border-t border-gray-100 my-2"></div>

                        {/* Language Switcher */}
                        <div className="px-4 py-2">
                          <LanguageSwitcher />
                        </div>

                        <div className="border-t border-gray-100 my-2"></div>

                        {/* Sign Out */}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4" />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : initialized ? (
              /* Guest State */
              <div className="flex items-center space-x-3">
                <LanguageSwitcher />
                <AppKitWalletButton variant="connect" size="sm" />
                <Link href={ROUTES.AUTH.LOGIN}>
                  <Button variant="ghost" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    {t('login')}
                  </Button>
                </Link>
                <Link href={ROUTES.AUTH.REGISTER}>
                  <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
                    {t('register')}
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </nav>
  )
}