'use client';

import React, { useState } from 'react';
import { Transaction } from '@/domain/entities/Transaction';
import { Category } from '@/domain/entities/Category';
import { Account } from '@/domain/entities/Account';
import { TransactionTable } from './TransactionTable';
import { TransactionForm } from './TransactionForm';
import { Plus, Search, Filter, Calendar, CreditCard, X } from 'lucide-react';
import { ConfirmDialog } from '@/infrastructure/ui/ConfirmDialog';
import { useToast } from '@/infrastructure/ui/ToastProvider';
import { exportToCSV, exportToExcel, exportToPDF } from '@/infrastructure/utils/ExportUtils';
import { Download, FileSpreadsheet, FileText, FileJson } from 'lucide-react';
import { format } from 'date-fns';
import { apiService } from '@/infrastructure/services/apiService';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

interface TransactionsClientProps {
    initialTransactions: (Transaction & { category?: Category; account?: Account })[];
    categories: Category[];
    accounts: Account[];
}

export const TransactionsClient: React.FC<TransactionsClientProps> = ({ 
    initialTransactions, 
    accounts: initialAccounts, 
    categories: initialCategories 
}) => {
    const { userId } = useAuth();
    const organizationId = userId || 'default_org';
    const toast = useToast();
    
    const [transactions, setTransactions] = useState(initialTransactions);
    const [accounts, setAccounts] = useState(initialAccounts);
    const [categories, setCategories] = useState(initialCategories);
    
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Refresh data on mount
    useEffect(() => {
        refreshData();
    }, [organizationId]);

    const refreshData = async () => {
        try {
            const [t, a, c] = await Promise.all([
                apiService.get('transactions', organizationId),
                apiService.get('accounts', organizationId),
                apiService.get('categories', organizationId)
            ]);

            // Enrich transactions with category and account objects for display
            const enriched = t.map((tx: any) => ({
                ...tx,
                category: c.find((cat: any) => cat.id === tx.categoryId) || null,
                account:  a.find((acc: any) => acc.id === tx.accountId)  || null,
            }));

            setTransactions(enriched);
            setAccounts(a);
            setCategories(c);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    
    // Filters State
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        accountId: 'all',
        type: 'all'
    });
    
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
        setEditingTransaction(null);
        setIsDrawerOpen(true);
    };

    const handleOpenEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsDrawerOpen(true);
    };

    const handleClose = () => {
        setIsDrawerOpen(false);
        setEditingTransaction(null);
    };

    const handleSubmit = async (data: any) => {
        setConfirmState({
            isOpen: true,
            title: editingTransaction ? 'Confirmar Alteração' : 'Confirmar Lançamento',
            message: editingTransaction 
                ? 'Deseja salvar as alterações nesta transação?' 
                : 'Deseja confirmar o lançamento desta nova transação?',
            variant: 'primary',
            confirmLabel: editingTransaction ? 'Salvar Alterações' : 'Confirmar',
            onConfirm: () => performSubmit(data)
        });
    };

    const performSubmit = async (data: any) => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        try {
            if (editingTransaction) {
                await apiService.put('transactions', editingTransaction.id, data);
            } else {
                await apiService.post('transactions', { ...data, organizationId });
            }

            toast.success(editingTransaction ? 'Transação atualizada!' : 'Transação criada com sucesso!');
            handleClose();
            refreshData();
        } catch (error) {
            console.error('Error submitting transaction:', error);
            toast.error('Ocorreu um erro inesperado ao salvar.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Confirmar Exclusão',
            message: 'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
            variant: 'danger',
            confirmLabel: 'Excluir Transação',
            onConfirm: () => performDelete(id)
        });
    };

    const performDelete = async (id: string) => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
            await apiService.delete('transactions', id);
            toast.success('Transação excluída com sucesso!');
            refreshData();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('Não foi possível excluir a transação.');
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const transDate = new Date(t.date).toISOString().split('T')[0];
        
        if (filters.startDate && transDate < filters.startDate) return false;
        if (filters.endDate && transDate > filters.endDate) return false;
        
        if (filters.accountId !== 'all' && t.accountId !== filters.accountId) return false;
        if (filters.type !== 'all' && t.type !== filters.type) return false;
        
        return true;
    });

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            accountId: 'all',
            type: 'all'
        });
    };

    const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
        const dataToExport = filteredTransactions.map(t => ({
            Data: new Intl.DateTimeFormat('pt-BR').format(new Date(t.date)),
            Descrição: t.description,
            Tipo: t.type === 'Income' ? 'Receita' : 'Despesa',
            Valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount),
            Conta: accounts.find(a => a.id === t.accountId)?.name || 'N/A',
            Categoria: categories.find(c => c.id === t.categoryId)?.name || 'N/A'
        }));

        const fileName = `Transacoes_${new Date().toISOString().split('T')[0]}`;

        if (format === 'csv') exportToCSV(dataToExport, fileName);
        if (format === 'excel') exportToExcel(dataToExport, fileName);
        if (format === 'pdf') exportToPDF(dataToExport, fileName, 'Relatório de Transações');
        
        toast.info(`Exportando para ${format.toUpperCase()}...`);
    };

    return (
        <div className="relative min-h-[calc(100vh-80px)] p-6 md:p-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Transações</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gerencie suas receitas e despesas.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl mr-2">
                        <button 
                            onClick={() => handleExport('csv')}
                            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all rounded-lg hover:bg-white dark:hover:bg-zinc-800"
                            title="Exportar CSV"
                        >
                            <FileText size={20} />
                        </button>
                        <button 
                            onClick={() => handleExport('excel')}
                            className="p-2 text-emerald-600 hover:text-emerald-700 transition-all rounded-lg hover:bg-white dark:hover:bg-zinc-800"
                            title="Exportar Excel"
                        >
                            <FileSpreadsheet size={20} />
                        </button>
                        <button 
                            onClick={() => handleExport('pdf')}
                            className="p-2 text-red-500 hover:text-red-600 transition-all rounded-lg hover:bg-white dark:hover:bg-zinc-800"
                            title="Exportar PDF"
                        >
                            <Download size={20} />
                        </button>
                    </div>

                    <button 
                        onClick={() => handleOpenCreate()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-lg"
                    >
                        <Plus size={20} />
                        Nova Transação
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50 font-semibold mb-2">
                    <Filter size={18} className="text-zinc-400" />
                    <span>Filtros Avançados</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Period */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Período</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50 transition-all outline-none"
                                title="Data Inicial"
                                placeholder="dd/mm/aaaa"
                            />
                            <span className="text-zinc-400">a</span>
                            <input 
                                type="date" 
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50 transition-all outline-none"
                                title="Data Final"
                                placeholder="dd/mm/aaaa"
                            />
                        </div>
                    </div>


                    {/* Account */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Conta</label>
                        <select 
                            value={filters.accountId}
                            onChange={(e) => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50 transition-all outline-none"
                        >
                            <option value="all">Todas as Contas</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>{account.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tipo</label>
                        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                            <button 
                                onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${filters.type === 'all' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                Todos
                            </button>
                            <button 
                                onClick={() => setFilters(prev => ({ ...prev, type: 'Income' }))}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${filters.type === 'Income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-zinc-500 hover:text-emerald-600'}`}
                            >
                                Receitas
                            </button>
                            <button 
                                onClick={() => setFilters(prev => ({ ...prev, type: 'Expense' }))}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${filters.type === 'Expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-zinc-500 hover:text-rose-600'}`}
                            >
                                Despesas
                            </button>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                        <button 
                            onClick={clearFilters}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-sm"
                        >
                            <X size={16} />
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            <TransactionTable 
                transactions={filteredTransactions} 
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
                        <TransactionForm 
                            initialData={editingTransaction || {}}
                            categories={categories}
                            accounts={accounts}
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
