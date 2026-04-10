import { useState } from 'react'
import { Clock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../lib/AuthContext'
import { UserRole } from '../../lib/supabase'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<UserRole>('cliente')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setErrorMsg(error.message)
      // On success, AuthContext updates user/role and App.tsx redirects automatically
    } else {
      const { error } = await signUp(email, password, role, nombre)
      if (error) setErrorMsg(error.message)
      else setSuccessMsg('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Clock className="w-12 h-12 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">A tiempo</h1>
          </div>
          <p className="text-gray-600">Sistema de agendamiento de citas inteligente</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setErrorMsg(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role selector - only on register */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de cuenta</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('cliente')}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${role === 'cliente' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    👤 Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${role === 'admin' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600'}`}
                  >
                    🔑 Administrador
                  </button>
                </div>
              </div>
            )}

            {/* Nombre - only on register */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error / Success messages */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                {successMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-6">
            Al continuar, aceptas nuestros términos de uso
          </p>
        </div>
      </div>
    </div>
  )
}
