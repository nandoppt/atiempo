import { Calendar, Clock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (type: 'admin' | 'client') => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Clock className="w-12 h-12 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">A tiempo</h1>
          </div>
          <p className="text-gray-600">Sistema de agendamiento de citas inteligente</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Selecciona tu rol
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => onLogin('admin')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
            >
              <Calendar className="w-6 h-6" />
              Acceso Administrador
            </button>

            <button
              onClick={() => onLogin('client')}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-4 px-6 rounded-xl border-2 border-gray-200 hover:border-indigo-300 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <Clock className="w-6 h-6" />
              Acceso Cliente
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Sistema de demostración - Versión visual (sin backend)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
