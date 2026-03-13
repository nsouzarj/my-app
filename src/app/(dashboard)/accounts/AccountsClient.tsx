'use client';

import React, { useState } from 'react';
import { Account } from '@/domain/entities/Account';
import { AccountTable } from './AccountTable';
import { AccountForm } from './AccountForm';
import { Plus } from 'lucide-react';
import { ConfirmDialog } from '@/infrastructure/ui/ConfirmDialog';
import { useToast } from '@/infrastructure/ui/ToastProvider';
import { apiService } from '@/infrastructure/services/apiService';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

interface AccountsClientProps {
    initialAccounts: Account[];
}

export const AccountsClient: React.FC<AccountsClientProps> = ({ initialAccounts }) => {
    const { userId } = useAuth();
    const organizationId = userId || 'default_org';
    const toast = useToast();
    const [accounts, setAccounts] = useState(initialAccounts);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        refreshData();
    }, [organizationId]);

    const refreshData = async () => {
        try {
            const data = await apiService.get('accounts', organizationId);
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    // Confirmation Dialog State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'primary' | 'danger' | 'success';
        onConfirm: () => void;
        confirmLabel?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'primary',
        onConfirm: () => {},
    });

    const handleOpenCreate = () => {
        setEditingAccount(null);
        setIsDrawerOpen(true);
    };

    const handleOpenEdit = (account: Account) => {
        setEditingAccount(account);
        setIsDrawerOpen(true);
    };

    const handleClose = () => {
        setIsDrawerOpen(false);
        setEditingAccount(null);
    };

    const handleSubmit = async (data: any) => {
        setConfirmState({
            isOpen: true,
            title: editingAccount ? 'Confirmar Alteração' : 'Confirmar Criação',
            message: editingAccount 
                ? 'Deseja salvar as alterações nesta conta?' 
                : 'Deseja confirmar a criação desta nova conta?',
            variant: 'primary',
            confirmLabel: editingAccount ? 'Salvar' : 'Criar',
            onConfirm: () => performSubmit(data)
        });
    };

    const performSubmit = async (data: any) => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        try {
            if (editingAccount) {
                await apiService.put('accounts', editingAccount.id, data);
            } else {
                await apiService.post('accounts', { ...data, organizationId });
            }

            toast.success(editingAccount ? 'Conta atualizada!' : 'Conta criada com sucesso!');
            handleClose();
            refreshData();
        } catch (error) {
            console.error('Error submitting account:', error);
            toast.error('Erro inesperado ao salvar conta.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Excluir Conta',
            message: 'Tem certeza que deseja excluir esta conta? Todas as transações vinculadas serão excluídas permanentemente.',
            variant: 'danger',
            confirmLabel: 'Excluir Permanentemente',
            onConfirm: () => performDelete(id)
        });
    };

    const performDelete = async (id: string) => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
            await apiService.delete('accounts', id);
            toast.success('Conta excluída com sucesso!');
            refreshData();
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Não foi possível excluir a conta.');
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-80px)] p-6 md:p-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Contas</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gerencie seu patrimônio em um único lugar.</p>
                </div>
                <button 
                    onClick={handleOpenCreate}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-zinc-200 dark:shadow-none"
                >
                    <Plus size={20} />
                    Nova Conta
                </button>
            </div>

            <AccountTable 
                accounts={accounts} 
                onEdit={handleOpenEdit} 
                onDelete={handleDelete} 
            />

            {/* Confirmation Dialog */}
            <ConfirmDialog 
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                confirmLabel={confirmState.confirmLabel}
                onConfirm={confirmState.onConfirm}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                isLoading={isLoading}
            />

            {/* Drawer Backdrop */}
            {isDrawerOpen && (
                <div 
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end transition-all animate-in fade-in duration-300"
                    onClick={handleClose}
                >
                    <div 
                        className="animate-in slide-in-from-right duration-300 h-full w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <AccountForm 
                            initialData={editingAccount || {}}
                            onSubmit={handleSubmit}
                            onClose={handleClose}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
