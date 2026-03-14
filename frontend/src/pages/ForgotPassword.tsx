import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../lib/api'
import { toast } from '../components/ui/Toast'
import { Mail, ArrowLeft, Send } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await apiService.post('auth/forgot_password', { email })
      if (response.success) {
        setIsSent(true)
        toast.success(response.message)
      } else {
        toast.error(response.error || 'Erro ao processar solicitação')
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
          <Link 
            to="/login"
            className="inline-flex items-center gap-2 text-app-text-dim hover:text-app-text transition-colors mb-8 group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold">Voltar para entrar</span>
          </Link>
          
          <div className="mb-10">
            <h1 className="text-4xl font-black text-app-text tracking-tighter mb-3">
              Recuperar Senha
            </h1>
            <p className="text-app-text-dim text-lg leading-relaxed font-medium">
              Enviaremos um link de recuperação para o seu e-mail cadastrado.
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-app-text-dim px-1">
                  E-mail institucional
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-app-text-dim group-focus-within:text-app-accent transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-app-bg border border-app rounded-2xl pl-14 pr-5 py-4 text-app-text placeholder:text-app-text-dim/30 focus:ring-2 focus:ring-app-accent focus:border-app-accent outline-none transition-all text-lg font-medium"
                    placeholder="voce@exemplo.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-app-text text-app-bg py-5 rounded-2xl font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-app-text/10 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-4 border-app-bg border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={20} />
                    Enviar Link
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center p-8 bg-app-soft/30 rounded-3xl border border-app animate-in fade-in slide-in-from-bottom duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                <Mail size={40} />
              </div>
              <h3 className="text-xl font-bold text-app-text mb-2 tracking-tight">E-mail Enviado!</h3>
              <p className="text-app-text-dim text-sm leading-relaxed font-medium">
                Confira sua caixa de entrada e spam. O link expira em 60 minutos.
              </p>
              <button 
                onClick={() => setIsSent(false)}
                className="mt-8 text-app-accent font-bold text-sm hover:underline"
              >
                Não recebeu? Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
