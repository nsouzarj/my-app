import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Building2, User, Save, ShieldCheck, Palette, Check, Sun, Monitor, RefreshCw, Trash2, AlertOctagon } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { toast } from '../components/ui/Toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { cn } from '../lib/utils'

export default function Settings() {
  const { user, organization, updateUser, updateOrganization, logout } = useAuth()
  const { skin, setSkin } = useTheme()
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReconciling, setIsReconciling] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isReconcileConfirmOpen, setIsReconcileConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const skins = [
    { id: 'midnight', name: 'Midnight', color: 'bg-zinc-100', accent: 'bg-white border-zinc-200' },
    { id: 'emerald', name: 'Emerald', color: 'bg-emerald-500', accent: 'bg-emerald-400 border-emerald-300' },
    { id: 'ocean', name: 'Ocean', color: 'bg-sky-500', accent: 'bg-sky-400 border-sky-300' },
    { id: 'slate', name: 'Slate', color: 'bg-slate-400', accent: 'bg-slate-300 border-slate-200' },
    { id: 'gold', name: 'Premium Gold', color: 'bg-amber-500', accent: 'bg-amber-400 border-amber-300' },
    { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-[#050505]', accent: 'bg-[#00f2ff] border-[#1a1a1e]' },
    { id: 'nordic', name: 'Nordic Shore', color: 'bg-[#2e3440]', accent: 'bg-[#88c0d0] border-[#4c566a]' },
    { id: 'velvet', name: 'Black Velvet', color: 'bg-[#000000]', accent: 'bg-[#e11d48] border-[#1a1a1a]' },
    { id: 'forest', name: 'Deep Forest', color: 'bg-[#06100c]', accent: 'bg-[#22c55e] border-[#1a3b30]' },
    { id: 'snow', name: 'Snow Soft', color: 'bg-white', accent: 'bg-[#0f172a] border-[#e2e8f0]', icon: Sun },
    { id: 'solar', name: 'Solarized', color: 'bg-[#fdf6e3]', accent: 'bg-[#586e75] border-[#d3c6aa]' },
    { id: 'rose', name: 'Rose Quartz', color: 'bg-[#fff1f2]', accent: 'bg-[#881337] border-[#fecdd3]', icon: Palette },
    { id: 'mint', name: 'Mint Fresh', color: 'bg-[#f0fdf4]', accent: 'bg-[#166534] border-[#bbf7d0]' },
    { id: 'sky', name: 'Sky Blue', color: 'bg-[#f0f9ff]', accent: 'bg-[#0c4a6e] border-[#bae6fd]' },
    { id: 'sand', name: 'Sandstone', color: 'bg-[#fafaf9]', accent: 'bg-[#44403c] border-[#e7e5e4]' },
    { id: 'light', name: 'Claro', color: 'bg-white border-zinc-200', accent: 'bg-zinc-900', icon: Sun },
    { id: 'system', name: 'Sistema', color: 'bg-zinc-500', accent: 'bg-white', icon: Monitor },
  ] as const;

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '')
    }
    if (user) {
      setFullName(user.fullName || '')
    }
  }, [organization, user])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsConfirmOpen(true)
  }

  async function performSave() {
    setIsConfirmOpen(false)
    setIsLoading(true)
    try {
      await apiService.post('config', { 
        name: orgName, 
        organizationId: organization.organizationId 
      })

      await apiService.post('auth/update_profile', {
        userId: user.id,
        fullName: fullName
      })

      updateUser({ ...user, fullName })
      updateOrganization({ ...organization, name: orgName })
      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setIsLoading(false)
    }
  }

  async function performReconcile() {
    setIsReconcileConfirmOpen(false)
    setIsReconciling(true)
    try {
      const response = await apiService.post('reconcile_all', {
        organizationId: organization.organizationId
      })
      
      if (response.success) {
        toast.success(response.message || 'Saldos sincronizados!')
      } else {
        throw new Error(response.error)
      }
    } catch (error: any) {
      console.error('Reconcile error:', error)
      toast.error(error.message || 'Erro ao sincronizar saldos.')
    } finally {
      setIsReconciling(false)
    }
  }

  async function performDeleteAccount() {
    setIsDeleteConfirmOpen(false)
    setIsLoading(true)
    try {
      const response = await apiService.post('auth/delete_account', {
        userId: user.id,
        organizationId: organization.organizationId
      })

      if (response.success) {
        toast.success('Sua conta foi excluída permanentemente.')
        // Logout e Redirecionar
        setTimeout(() => {
          logout()
        }, 2000)
      } else {
        throw new Error(response.error)
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir conta.')
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <header>
          <h1 className="text-3xl font-bold text-app-text tracking-tight">Configurações</h1>
          <p className="text-app-text-dim mt-1">Gerencie seu workspace e preferências de aparência.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-app-card border border-app rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-app-bg border-4 border-app-border flex items-center justify-center text-app-text-dim">
                    <User size={48} />
                  </div>
                  <div className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full border-4 border-app-bg">
                    <ShieldCheck size={16} className="text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-app-text">{user?.fullName || 'Usuário'}</h2>
                  <p className="text-app-text-dim text-sm">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-app-text text-app-bg rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck size={20} className="text-app-bg opacity-70" />
                <h3 className="font-bold">Segurança</h3>
              </div>
              <p className="text-sm text-app-bg/80 leading-relaxed font-medium">
                Sua conta está protegida pelo nosso sistema de autenticação customizado.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleSave} className="bg-app-card border border-app rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-app flex items-center gap-3">
                <div className="p-2 bg-app-bg rounded-lg">
                  <Building2 size={20} className="text-app-text" />
                </div>
                <h3 className="text-lg font-bold text-app-text">Workspace e Perfil</h3>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-app-text-dim">Nome do Usuário</label>
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 bg-app-bg border border-app rounded-xl text-app-text focus:ring-2 focus:ring-app-accent outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-app-text-dim">Nome do Workspace</label>
                  <input 
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ex: Finanças Pessoais"
                    className="w-full px-4 py-3 bg-app-bg border border-app rounded-xl text-app-text focus:ring-2 focus:ring-app-accent outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-app-bg border border-app rounded-xl">
                    <span className="text-xs text-app-text-dim block mb-1">ID da Organização</span>
                    <span className="text-sm font-mono text-app-text-dim break-all">{organization?.organizationId}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-app-bg/50 border-t border-app flex justify-end">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-8 py-3 bg-app-text text-app-bg font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {isLoading ? <LoadingSpinner size="sm" className="border-app-bg border-t-app-accent" /> : <Save size={18} />}
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>

            {/* Appearance (Skins) */}
            <div className="bg-app-card border border-app rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-app-bg rounded-lg">
                  <Palette size={20} className="text-app-text" />
                </div>
                <h3 className="text-lg font-bold text-app-text">Aparência (Skins)</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-app-text">Escolha sua Skin Premium</h4>
                  <p className="text-sm text-app-text-dim">Selecione uma paleta de cores para personalizar sua experiência.</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {skins.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSkin(s.id)}
                      className={cn(
                        "group relative flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                        skin === s.id 
                          ? "bg-app-bg border-white/20 shadow-lg ring-2 ring-white/10" 
                          : "bg-app-bg/40 border-app-border hover:border-white/10 hover:bg-app-bg"
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-full shadow-inner flex items-center justify-center transition-transform group-hover:scale-110", s.color)}>
                        {skin === s.id ? (
                          <Check className={cn("w-6 h-6", s.id === 'light' ? 'text-black' : 'text-white')} />
                        ) : (
                          'icon' in s && s.icon && <s.icon className={cn("w-6 h-6", s.id === 'light' ? 'text-zinc-400' : 'text-zinc-200')} />
                        )}
                      </div>
                      <span className={cn("text-xs font-bold transition-colors", skin === s.id ? "text-app-text" : "text-app-text-dim")}>
                        {s.name}
                      </span>
                      <div className={cn("absolute top-2 right-2 w-2 h-2 rounded-full", s.accent)}></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Utilitários */}
            <div className="bg-app-card border border-app rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-app-bg rounded-lg">
                  <RefreshCw size={20} className="text-app-text" />
                </div>
                <h3 className="text-lg font-bold text-app-text">Utilitários do Sistema</h3>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                  <h4 className="font-bold text-amber-500 flex items-center gap-2">
                    <ShieldCheck size={18} />
                    Sincronização de Saldos
                  </h4>
                  <p className="text-sm text-app-text-dim mt-2 leading-relaxed">
                    Esta ferramenta recalcula o saldo real de todas as suas contas baseando-se no histórico completo de transações. 
                    Use isto caso note qualquer discrepância nos valores exibidos.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsReconcileConfirmOpen(true)}
                    disabled={isReconciling}
                    className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-50"
                  >
                    {isReconciling ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw size={18} />}
                    {isReconciling ? 'Sincronizando...' : 'Sincronizar Todos os Saldos'}
                  </button>
                </div>
              </div>
            </div>

            {/* Zona de Perigo */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Trash2 size={20} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-500">Zona de Perigo</h3>
              </div>
              
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <h4 className="font-bold text-red-600 flex items-center gap-2">
                  <AlertOctagon size={18} />
                  Excluir Permanentemente Conta e Dados
                </h4>
                <p className="text-sm text-red-600/80 mt-2 leading-relaxed font-medium">
                  Esta ação é irreversível. Todas as suas transações, contas, categorias e dados de perfil serão apagados para sempre de nossos servidores.
                </p>
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isLoading}
                  className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
                >
                  <Trash2 size={18} />
                  Excluir Minha Conta e Dados
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Salvar Alterações"
        message="Deseja realmente atualizar suas configurações?"
        confirmLabel="Salvar"
        onConfirm={performSave}
        onClose={() => setIsConfirmOpen(false)}
        isLoading={isLoading}
      />

      <ConfirmDialog 
        isOpen={isReconcileConfirmOpen}
        title="Sincronizar Saldos"
        message="Esta ação irá recalcular o saldo de todas as suas contas baseando-se no histórico de transações. Deseja prosseguir?"
        confirmLabel="Sincronizar"
        onConfirm={performReconcile}
        onClose={() => setIsReconcileConfirmOpen(false)}
        isLoading={isReconciling}
      />

      <ConfirmDialog 
        isOpen={isDeleteConfirmOpen}
        title="EXCLUIR CONTA PERMANENTEMENTE"
        message="Esta ação é IRREVERSÍVEL. Todos os seus dados, configurações e histórico serão apagados PARA SEMPRE. Tem certeza absoluta que deseja excluir sua conta?"
        confirmLabel="EXCLUIR TUDO"
        onConfirm={performDeleteAccount}
        onClose={() => setIsDeleteConfirmOpen(false)}
        isLoading={isLoading}
        variant="danger"
      />
    </DashboardLayout>
  )
}
