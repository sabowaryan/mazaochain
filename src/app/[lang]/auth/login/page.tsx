import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLogo } from '@/components/ui/Logo';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className=" w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <AuthLogo />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion à MazaoChain
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous à votre compte pour accéder à la plateforme
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}