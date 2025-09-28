// Application constants

export const APP_CONFIG = {
  name: 'MazaoChain MVP',
  description: 'Plateforme de prêt décentralisée pour les agriculteurs en RDC',
  version: '1.0.0',
  supportedLanguages: ['fr'],
  defaultLanguage: 'fr'
} as const

export const USER_ROLES = {
  AGRICULTEUR: 'agriculteur',
  COOPERATIVE: 'cooperative', 
  PRETEUR: 'preteur',
  ADMIN: 'admin'
} as const

export const CROP_TYPES = {
  MANIOC: 'manioc',
  CAFE: 'cafe'
} as const

export const LOAN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ACTIVE: 'active',
  REPAID: 'repaid',
  DEFAULTED: 'defaulted'
} as const

export const EVALUATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const

export const COLLATERAL_REQUIREMENTS = {
  MIN_RATIO: 200, // 200% minimum collateral ratio
  BUFFER_RATIO: 250 // 250% recommended ratio
} as const

export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    CALLBACK: '/auth/callback'
  },
  DASHBOARD: {
    FARMER: '/dashboard/farmer',
    FARMER_PROFILE: '/dashboard/farmer/profile',
    FARMER_EVALUATIONS: '/dashboard/farmer/evaluations',
    FARMER_LOANS: '/dashboard/farmer/loans',
    FARMER_PORTFOLIO: '/dashboard/farmer/portfolio',
    COOPERATIVE: '/dashboard/cooperative',
    COOPERATIVE_PROFILE: '/dashboard/cooperative/profile',
    COOPERATIVE_EVALUATIONS: '/dashboard/cooperative/evaluations',
    COOPERATIVE_LOANS: '/dashboard/cooperative/loans',
    LENDER: '/dashboard/lender',
    LENDER_OPPORTUNITIES: '/dashboard/lender/opportunities',
    LENDER_PORTFOLIO: '/dashboard/lender/portfolio',
    ADMIN: '/admin'
  }
} as const