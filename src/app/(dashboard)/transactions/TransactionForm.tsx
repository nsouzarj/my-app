'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '@/domain/entities/Transaction';
import { Category } from '@/domain/entities/Category';
import { Account } from '@/domain/entities/Account';
import { X, Calendar, Tag, Wallet, FileText, ChevronRight } from 'lucide-react';
import { maskCurrency, parseCurrencyToNumber, formatCurrency } from '@/infrastructure/utils/currencyUtils';

interface TransactionFormProps {
    initialData?: Partial<Transaction>;
    categories: Category[];
    accounts: Account[];
    onSubmit: (data: any) => Promise<void>;
    onClose: () => void;
    isLoading?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
    initialData, 
    categories, 
    accounts, 
    onSubmit, 
    onClose,
    isLoading 
}) => {
    const [type, setType] = useState<TransactionType>(initialData?.type || 'Expense');
    const [amount, setAmount] = useState(initialData?.amount ? formatCurrency(initialData.amount) : '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
    const [accountId, setAccountId] = useState(initialData?.accountId || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            type,
            amount: parseCurrencyToNumber(amount),
            description,
            date: new Date(date),
            categoryId,
            accountId,
        });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 w-full max-w-md shadow-2xl overflow-y-auto">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {initialData?.id ? 'Editar Transação' : 'Nova Transação'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <X size={20} className="text-zinc-500" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Type Toggle */}
                <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setType('Expense')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                            type === 'Expense' 
                            ? 'bg-white dark:bg-zinc-800 text-rose-600 shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                    >
                        Despesa
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('Income')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                            type === 'Income' 
                            ? 'bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm' 
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                        }`}
                    >
                        Receita
                    </button>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Valor</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">R$</span>
                        <input
                            type="text"
                            required
                            value={amount}
                            onChange={(e) => setAmount(maskCurrency(e.target.value))}
                            placeholder="0,00"
                            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50 outline-none transition-all text-lg font-semibold"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Descrição</label>
                    <div className="relative">
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Aluguel, Supermercado..."
                            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Categoria</label>
                    <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <select
                            required
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50 outline-none transition-all appearance-none"
                        >
                            <option value="">Selecione uma categoria</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Account */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Conta</label>
                    <div className="relative">
                        <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <select
                            required
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50 outline-none transition-all appearance-none"
                        >
                            <option value="">Selecione uma conta</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Data</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                        {isLoading ? 'Salvando...' : (initialData?.id ? 'Atualizar Transação' : 'Criar Transação')}
                        {!isLoading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                </div>
            </form>
        </div>
    );
};
