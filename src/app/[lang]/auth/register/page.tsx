import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthLogo } from '@/components/ui/Logo';
import { 
  UserIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Registration form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
        {/* Decorative elements for continuity */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-teal-100/25 rounded-full -translate-y-18 translate-x-18 auth-decoration-float"></div>
        <div className="absolute top-1/3 left-0 w-28 h-28 bg-emerald-100/20 rounded-full -translate-x-14 auth-decoration-float-delayed"></div>
        <div className="absolute bottom-0 left-0 w-44 h-44 bg-green-50/35 rounded-full translate-y-22 -translate-x-22 auth-decoration-float-slow"></div>
        <div className="absolute bottom-1/4 right-0 w-24 h-24 bg-teal-50/25 rounded-full translate-x-12 auth-decoration-float"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-emerald-50/15 rounded-full auth-decoration-float-delayed"></div>
        
        <div className="w-full max-w-screen-lg space-y-8 py-12 relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <AuthLogo className="h-10 w-auto auth-logo-mobile" colorScheme="default" />
          </div>
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Rejoignez MazaoChain
            </h2>
            <p className="text-gray-600 text-lg">
              Créez votre compte et commencez votre parcours dans l'agriculture décentralisée
            </p>
          </div>
          
          <RegisterForm />
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-bl from-teal-600 via-emerald-700 to-green-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="mb-8">
            <div className="mb-8">
              <AuthLogo className="h-12 w-auto auth-logo-desktop" colorScheme="inverse" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Transformez
              <span className="block text-teal-200">l'agriculture</span>
              <span className="block text-green-200">ensemble</span>
            </h1>
            <p className="text-xl text-teal-100 leading-relaxed max-w-screen-md">
              Rejoignez une communauté d'agriculteurs, de coopératives et d'investisseurs 
              qui construisent l'avenir de l'agriculture en République Démocratique du Congo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-10 h-10 bg-emerald-400 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold">Agriculteurs</h3>
              </div>
              <p className="text-teal-100 text-sm">
                Tokenisez vos récoltes et accédez à des financements innovants
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-10 h-10 bg-teal-400 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold">Coopératives</h3>
              </div>
              <p className="text-teal-100 text-sm">
                Gérez et validez les évaluations de vos membres agriculteurs
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold">Investisseurs</h3>
              </div>
              <p className="text-teal-100 text-sm">
                Investissez dans des prêts agricoles sécurisés et transparents
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-teal-400/10 rounded-full -translate-y-32 -translate-x-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-400/10 rounded-full translate-y-48 translate-x-48"></div>
      </div>
    </div>
  );
}
