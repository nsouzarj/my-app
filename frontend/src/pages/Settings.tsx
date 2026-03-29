import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Building2, User, Save, ShieldCheck, Palette, Check, Sun, Monitor, RefreshCw, Trash2, AlertOctagon, Fingerprint, CalendarDays, Mail, Download, Upload, Database } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { toast } from '../components/ui/Toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { cn } from '../lib/utils'
import { webauthn } from '../lib/webauthn'

export default function Settings() {
  const { user, organization, updateUser, updateOrganization, logout } = useAuth()
  const { skin, setSkin } = useTheme()
  const [orgName, setOrgName] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [reminderDays, setReminderDays] = useState(7)
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [whatsappNotifications, setWhatsappNotifications] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isWebAuthnLoading, setIsWebAuthnLoading] = useState(false)
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
    { id: 'cyberpool', name: 'Cyber-Pool', color: 'bg-[#00e5ff]', accent: 'bg-[#ff5f00] border-[#003035]' },
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
      setEmailNotifications(organization.emailNotifications || false)
      setWhatsappNotifications(organization.whatsappNotifications || false)
    }
    if (user) {
      setFullName(user.fullName || '')
      setPhone(user.phone || '')
      setReminderDays(user.reminderDays || 7)
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
        emailNotifications: emailNotifications ? 1 : 0,
        whatsappNotifications: whatsappNotifications ? 1 : 0,
        organizationId: organization.organizationId 
      })

      await apiService.post('auth/update_profile', {
        userId: user.id,
        fullName: fullName,
        phone: phone,
        reminderDays: reminderDays
      })

      updateUser({ ...user, fullName, phone, reminderDays })
      updateOrganization({ ...organization, name: orgName, emailNotifications, whatsappNotifications })
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

  async function handleRegisterBiometrics() {
    if (!webauthn.isSupported()) {
      toast.error('Seu navegador não suporta biometria.')
      return
    }

    setIsWebAuthnLoading(true)
    try {
      // 1. Obter desafio
      const challengeData = await apiService.auth.webauthn.getChallenge()
      if (!challengeData.success) throw new Error(challengeData.error || 'Erro ao obter desafio')

      // 2. Registrar no navegador
      const credential = await webauthn.register(challengeData.challenge, {
        id: user.id.toString(),
        name: user.email,
        displayName: user.fullName || user.email
      })

      // 3. Salvar no servidor
      const result = await apiService.auth.webauthn.register({
        ...credential,
        userId: user.id
      })

      if (result.success) {
        toast.success('Biometria registrada com sucesso! Agora você pode entrar usando sua digital.')
      } else {
        throw new Error(result.error || 'Erro ao salvar biometria')
      }
    } catch (error: any) {
      if (error.name !== 'NotAllowedError') {
        toast.error('Erro ao configurar biometria: ' + (error.message || 'Tente novamente'))
      }
    } finally {
      setIsWebAuthnLoading(false)
    }
  }

  const [isPushLoading, setIsPushLoading] = useState(false)

  async function handleEnableNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Seu navegador não suporta notificações web.')
      return
    }

    setIsPushLoading(true)
    try {
      // 1. Registrar SW se necessário
      const registration = await navigator.serviceWorker.register('/financas/sw.js', { scope: '/financas/' })
      
      // 2. Pedir permissão
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Você negou a permissão para notificações.')
      }

      // 3. Inscrever no Push
      const VAPID_PUBLIC_KEY = 'BBl5tpiuD1iUsMGGskH8CelnsS0_5xYfyPwoo1tMEvZBvorj1NKf0r2e9gVxHE40Nl9Gt3A1qV-d5Th3I7qjfrs'
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      // 4. Salvar no servidor
      await apiService.post('auth/save_push', {
        userId: user.id,
        ...JSON.parse(JSON.stringify(subscription))
      })

      localStorage.setItem('webpush_enabled', 'true')
      toast.success('Notificações ativadas! Você receberá alertas neste dispositivo.')
    } catch (error: any) {
      console.error('Push error:', error)
      toast.error(error.message || 'Erro ao ativar notificações.')
    } finally {
      setIsPushLoading(false)
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  async function handleExportBackup() {
    setIsExporting(true)
    try {
      const response = await fetch('/financas/api/auth/export_backup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (!response.ok) throw new Error('Falha ao exportar backup');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financas_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Backup exportado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar backup');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('backup', file);

      const response = await fetch('/financas/api/auth/import_backup.php', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message || 'Backup restaurado com sucesso!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(data.message || 'Erro ao restaurar backup');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao restaurar backup');
    } finally {
      setIsImporting(false);
      e.target.value = '';
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

            <div className="lg:hidden bg-app-text text-app-bg rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck size={20} className="text-app-bg opacity-70" />
                <h3 className="font-bold">Segurança</h3>
              </div>
              <p className="text-sm text-app-bg/80 leading-relaxed font-medium mb-6">
                Sua conta está protegida. Ative a biometria para um acesso mais rápido e seguro.
              </p>
              
              <button
                onClick={handleRegisterBiometrics}
                disabled={isWebAuthnLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-app-bg text-app-text rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isWebAuthnLoading ? <LoadingSpinner size="sm" className="border-app-text border-t-app-accent" /> : <Fingerprint size={18} />}
                {isWebAuthnLoading ? 'Configurando...' : 'Ativar Digital neste Celular'}
              </button>
            </div>

            {/* Backup - Desktop Only */}
            <div className="hidden md:block bg-app-card border border-app rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Database size={20} className="text-indigo-500" />
                <h3 className="font-bold text-app-text">Segurança & Backup</h3>
              </div>
              <p className="text-sm text-app-text-dim leading-relaxed mb-6">
                Faça o download completo de todos os seus dados locais ou restaure um backup anterior caso algo dê errado.
              </p>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl font-bold text-sm hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50"
                >
                  {isExporting ? <LoadingSpinner size="sm" className="border-indigo-500/30 border-t-indigo-500" /> : <Download size={18} />}
                  {isExporting ? 'Exportando...' : 'Fazer Backup (JSON)'}
                </button>
                
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportBackup} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={isImporting}
                  />
                  <button
                    type="button"
                    disabled={isImporting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-app-bg text-app-text rounded-xl font-bold text-sm hover:bg-app-bg/80 border border-app border-dashed transition-all disabled:opacity-50"
                  >
                    {isImporting ? <LoadingSpinner size="sm" className="border-app-text border-t-app-accent" /> : <Upload size={18} />}
                    {isImporting ? 'Restaurando...' : 'Restaurar Backup'}
                  </button>
                </div>
              </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="text-sm font-semibold text-app-text-dim">Telefone / WhatsApp</label>
                    <input 
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-3 bg-app-bg border border-app rounded-xl text-app-text focus:ring-2 focus:ring-app-accent outline-none transition-all"
                    />
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-app">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500">
                        <CalendarDays size={16} />
                      </div>
                      <label className="text-sm font-black text-app-text uppercase tracking-widest">Aviso de Planejamento</label>
                    </div>
                    <p className="text-xs text-app-text-dim leading-relaxed">Quantos dias antes do vencimento você quer ver o alerta de gasto planejado no seu painel?</p>
                    <div className="flex items-center gap-3">
                       <input 
                         type="number"
                         min="1"
                         max="60"
                         value={reminderDays}
                         onChange={(e) => setReminderDays(parseInt(e.target.value))}
                         className="w-24 px-4 py-3 bg-app-bg border border-app rounded-xl text-app-text font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                       />
                       <span className="text-sm font-bold text-app-text-dim">dias de antecedência</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-app-bg border border-app rounded-[24px]">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                            <Mail size={22} />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-app-text tracking-wide uppercase">Notificações por E-mail</h4>
                            <p className="text-xs text-app-text-dim mt-0.5">Receber resumo de contas a pagar por e-mail.</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={emailNotifications} 
                            onChange={e => setEmailNotifications(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-12 h-6.5 bg-app-soft/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-5 bg-app-bg border border-app rounded-[24px]">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                             <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-app-text tracking-wide uppercase">Notificações por WhatsApp</h4>
                            <p className="text-xs text-app-text-dim mt-0.5">Receber resumo de contas pelo WhatsApp.</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={whatsappNotifications} 
                            onChange={e => setWhatsappNotifications(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-12 h-6.5 bg-app-soft/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleEnableNotifications}
                      disabled={isPushLoading}
                      className="w-full flex items-center justify-center gap-2 p-5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-[24px] font-black uppercase text-xs hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      {isPushLoading ? <LoadingSpinner size="sm" className="border-indigo-100 border-t-white" /> : <ShieldCheck size={18} />}
                      {isPushLoading ? 'Ativando...' : 'Ativar Alertas neste Navegador / Celular'}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-app-bg border border-app rounded-xl">
                  <span className="text-xs text-app-text-dim block mb-1">ID da Organização</span>
                  <span className="text-sm font-mono text-app-text-dim break-all">{organization?.organizationId}</span>
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
