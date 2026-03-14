import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiService } from '../lib/api'
import { toast } from '../components/ui/Toast'
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Token de recuperação ausente')
      navigate('/login')
    }
  }, [token, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      const response = await apiService.post('auth/reset_password', { 
        token, 
        password 
      })
      
      if (response.success) {
        setIsSuccess(true)
        toast.success(response.message)
        setTimeout(() => navigate('/login'), 3000)
      } else {
        toast.error(response.error || 'Erro ao redefinir senha')
      }
    } catch (error) {
      toast.error('Erro de conexão com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-6 bg-gradient-to-br from-app via-app to-app-card">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-app-card border border-app rounded-[40px] shadow-2xl p-10 backdrop-blur-sm">
          {!isSuccess ? (
            <>
              <div className="mb-10">
                <h1 className="text-4xl font-black text-app-text tracking-tighter mb-3">
                  Nova Senha
                </h1>
                <p className="text-app-text-dim text-lg leading-relaxed font-medium">
                  Crie uma senha forte e segura para sua conta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-app-text-dim px-1">
                    Nova Senha
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-app-text-dim group-focus-within:text-app-accent transition-colors">
                      <Lock size={20} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-app-bg border border-app rounded-2xl pl-14 pr-14 py-4 text-app-text placeholder:text-app-text-dim/30 focus:ring-2 focus:ring-app-accent focus:border-app-accent outline-none transition-all text-lg font-medium"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-5 flex items-center text-app-text-dim hover:text-app-text transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-app-text-dim px-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-app-bg border border-app rounded-2xl px-5 py-4 text-app-text placeholder:text-app-text-dim/30 focus:ring-2 focus:ring-app-accent focus:border-app-accent outline-none transition-all text-lg font-medium"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-app-text text-app-bg py-5 rounded-2xl font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-app-text/10 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-4 border-app-bg border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Redefinir Minha Senha'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center p-8 animate-in fade-in slide-in-from-bottom duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-3xl font-black text-app-text mb-2 tracking-tighter">Senha Alterada!</h3>
              <p className="text-app-text-dim text-lg leading-relaxed font-medium">
                Sua senha foi redefinida com sucesso. Redirecionando para o login...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
