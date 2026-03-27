'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Building2, User, Save, ShieldCheck, CheckCircle2, AlertCircle, Sun, Moon, Monitor } from 'lucide-react';
import { apiService } from '@/infrastructure/services/apiService';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { cn } from '@/infrastructure/ui/utils';
import { useTheme } from 'next-themes';
import { ConfirmDialog } from '@/infrastructure/ui/ConfirmDialog';
import { useToast } from '@/infrastructure/ui/ToastProvider';

interface SettingsClientProps {
    organization: any;
}

export const SettingsClient: React.FC<SettingsClientProps> = ({ organization }) => {
    const { user } = useUser();
    const router = useRouter();
    const { setTheme, theme } = useTheme();
    const { userId } = useAuth();
    const organizationId = userId || 'default_org';
    const toast = useToast();
    const [orgName, setOrgName] = useState(organization?.name || '');
    const [isLoading, setIsLoading] = useState(false);

    // Confirmation Dialog State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const themes = [
        { id: 'light', label: 'Claro', icon: <Sun size={16} /> },
        { id: 'dark', label: 'Escuro', icon: <Moon size={16} /> },
        { id: 'cyber-pool', label: 'Cyber-Pool', icon: <Monitor size={16} className="text-accent" /> },
        { id: 'system', label: 'Sistema', icon: <Monitor size={16} /> },
    ];

    const handleOrgSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsConfirmOpen(true);
    };

    const performOrgSubmit = async () => {
        setIsConfirmOpen(false);
        setIsLoading(true);
        try {
            const result = await apiService.post('config', { name: orgName, organizationId });
            if (result.success) {
                toast.success('Configurações salvas com sucesso!');
            } else {
                toast.error(result.message || 'Erro ao salvar configurações.');
            }
        } catch (error) {
            console.error('Error updating organization:', error);
            toast.error('Erro inesperado ao salvar.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Configurações</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gerencie seu workspace e preferências de conta.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                                <img 
                                    src={user?.imageUrl} 
                                    alt="Profile" 
                                    className="w-24 h-24 rounded-full border-4 border-zinc-100 dark:border-zinc-900" 
                                />
                                <div className="absolute bottom-0 right-0 bg-emerald-500 p-1.5 rounded-full border-4 border-white dark:border-zinc-950">
                                    <ShieldCheck size={16} className="text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">{user?.fullName || 'Usuário'}</h2>
                                <p className="text-zinc-500 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black rounded-2xl p-6 shadow-lg shadow-zinc-200 dark:shadow-none">
                        <div className="flex items-center gap-3 mb-4">
                            <User size={20} className="text-zinc-400 dark:text-zinc-500" />
                            <h3 className="font-bold">Perfil Clerk</h3>
                        </div>
                        <p className="text-sm text-zinc-400 dark:text-zinc-500 leading-relaxed">
                            Sua autenticação é gerenciada com segurança pelo Clerk. Para alterar sua senha ou e-mail, utilize o botão de perfil no menu lateral.
                        </p>
                    </div>
                </div>

                {/* Organization Settings */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleOrgSubmit} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                                <Building2 size={20} className="text-zinc-950 dark:text-zinc-50" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Workspace (Organização)</h3>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nome do Workspace</label>
                                <input 
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Ex: Finanças Pessoais"
                                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                    required
                                />
                                <p className="text-xs text-zinc-500">Este nome aparecerá no menu lateral e nos seus relatórios.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                                    <span className="text-xs text-zinc-500 block mb-1">ID do Workspace</span>
                                    <span className="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">{organization?.id}</span>
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                                    <span className="text-xs text-zinc-500 block mb-1">Tipo</span>
                                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{organization?.type || 'Pessoal'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                            >
                                <Save size={18} />
                                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>

                    {/* Theme Settings */}
                    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                                <Sun size={20} className="text-zinc-950 dark:text-zinc-50" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Preferências da Interface</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Tema do Aplicativo</h4>
                                    <p className="text-sm text-zinc-500">Escolha como o sistema deve aparecer para você.</p>
                                </div>
                                
                                <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl">
                                    {themes.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTheme(t.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                                theme === t.id 
                                                    ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 shadow-sm" 
                                                    : "text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
                                            )}
                                        >
                                            {t.icon}
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                                <p className="text-xs text-zinc-500 leading-relaxed italic text-center">
                                    Nota: O modo "Sistema" sincroniza automaticamente com as configurações do seu dispositivo (Windows/macOS/iOS/Android).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog 
                isOpen={isConfirmOpen}
                title="Confirmar Alteração"
                message="Deseja realmente alterar o nome do seu workspace?"
                confirmLabel="Salvar"
                onConfirm={performOrgSubmit}
                onClose={() => setIsConfirmOpen(false)}
                isLoading={isLoading}
            />
        </div>
    );
};
