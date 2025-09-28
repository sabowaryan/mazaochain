import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className=" w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Inscription à MazaoChain
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Créez votre compte pour rejoindre la plateforme
          </p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <RegisterForm />
          <Link
            href="/auth/login"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
