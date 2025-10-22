import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLogo } from '@/components/ui/Logo';
import { 
  ShieldCheckIcon, 
  CreditCardIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="mb-8">
            <div className="mb-8">
              <AuthLogo className="h-12 w-auto auth-logo-desktop" colorScheme="inverse" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Bienvenue sur
              <span className="block text-emerald-200">MazaoChain</span>
            </h1>
            <p className="text-xl text-emerald-100 leading-relaxed max-w-screen-md">
              La plateforme décentralisée qui révolutionne le financement agricole en RDC. 
              Tokenisez vos récoltes, accédez au crédit et investissez dans l'agriculture durable.
            </p>
          </div>
          <div className="space-y-4 text-emerald-100">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-300" />
              <span>Tokenisation sécurisée des récoltes</span>
            </div>
            <div className="flex items-center space-x-3">
              <CreditCardIcon className="w-5 h-5 text-emerald-300" />
              <span>Accès facilité au crédit agricole</span>
            </div>
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="w-5 h-5 text-emerald-300" />
              <span>Investissements transparents</span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full translate-y-48 -translate-x-48"></div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
        {/* Decorative elements for continuity */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-100/30 rounded-full -translate-y-16 -translate-x-16 auth-decoration-float"></div>
        <div className="absolute top-1/4 right-0 w-24 h-24 bg-teal-100/20 rounded-full translate-x-12 auth-decoration-float-delayed"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-emerald-50/40 rounded-full translate-y-20 translate-x-20 auth-decoration-float-slow"></div>
        <div className="absolute bottom-1/3 left-0 w-20 h-20 bg-teal-50/30 rounded-full -translate-x-10 auth-decoration-float"></div>
        
        <div className="w-full max-w-screen-md space-y-8 relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <AuthLogo className="h-10 w-auto auth-logo-mobile" colorScheme="default" />
          </div>
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Connexion
            </h2>
            <p className="text-gray-600 text-lg">
              Connectez-vous pour accéder à votre tableau de bord
            </p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
  );
}