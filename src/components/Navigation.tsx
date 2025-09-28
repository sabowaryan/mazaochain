'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from '@/components/TranslationProvider'
import { Button } from '@/components/ui/Button'
import { WalletStatus } from '@/components/wallet/WalletStatus'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { NavbarLogo } from '@/components/ui/Logo'
import { AuthStatus } from '@/components/auth/AuthStatus'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ROUTES, USER_ROLES } from '@/lib/constants'
import { cn } from '@/lib/utils'

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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
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
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={ROUTES.HOME} className="flex-shrink-0">
              <NavbarLogo />
            </Link>
          </div>

          {/* Navigation Items - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated && initialized && (
              <>
                {getNavigationItems().map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 text-foreground/80 hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Loading State */}
            {!initialized && (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-muted-foreground">
                  {t('loading')}
                </span>
              </div>
            )}

            {/* Authenticated State */}
            {initialized && isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Auth Status - Mobile */}
                <div className="md:hidden">
                  <AuthStatus variant="badge" />
                </div>

                {/* Wallet & Notifications */}
                <div className="hidden sm:flex items-center space-x-3">
                  <WalletStatus />
                  <NotificationBell />
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="hidden md:block">
                      <AuthStatus variant="inline" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <svg 
                      className={cn(
                        "w-4 h-4 transition-transform",
                        isUserMenuOpen && "rotate-180"
                      )} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-md shadow-lg z-50">
                      <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-lg font-medium text-primary-700">
                              {user?.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-popover-foreground truncate">
                              {user?.email}
                            </p>
                            {profile && (
                              <p className="text-xs text-muted-foreground capitalize">
                                {profile.role} • {isValidated ? 'Validé' : 'En attente'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        {/* Mobile Navigation Items */}
                        <div className="md:hidden space-y-1 mb-2">
                          {getNavigationItems().map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                            >
                              {item.icon}
                              {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-border my-2"></div>
                        </div>

                        {/* Mobile Wallet & Notifications */}
                        <div className="sm:hidden space-y-1 mb-2">
                          <div className="px-3 py-2">
                            <WalletStatus />
                          </div>
                          <div className="px-3 py-2">
                            <NotificationBell />
                          </div>
                          <div className="border-t border-border my-2"></div>
                        </div>

                        {/* Language Switcher */}
                        <div className="px-3 py-2">
                          <LanguageSwitcher />
                        </div>

                        <div className="border-t border-border my-2"></div>

                        {/* Sign Out */}
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
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
                <Link href={ROUTES.AUTH.LOGIN}>
                  <Button variant="ghost" size="sm">
                    {t('login')}
                  </Button>
                </Link>
                <Link href={ROUTES.AUTH.REGISTER}>
                  <Button size="sm">
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