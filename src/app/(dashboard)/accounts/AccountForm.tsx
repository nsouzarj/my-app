'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Wallet, CreditCard, PiggyBank } from 'lucide-react';
import { Account } from '@/domain/entities/Account';
import { maskCurrency, parseCurrencyToNumber, formatCurrency } from '@/infrastructure/utils/currencyUtils';

interface AccountFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
    onClose: () => void;
    isLoading?: boolean;
}

export const AccountForm: React.FC<AccountFormProps> = ({ initialData, onSubmit, onClose, isLoading }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<Account['type']>(initialData?.type || 'Checking');
    const [balance, setBalance] = useState(initialData?.balance ? formatCurrency(initialData.balance) : '0,00');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setType(initialData.type || 'Checking');
            setBalance(initialData.balance ? formatCurrency(initialData.balance) : '0,00');
        }
    }, [initialData]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ 
            name, 
            type, 
            balance: parseCurrencyToNumber(balance) 
        });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {initialData?.id ? 'Editar Conta' : 'Nova Conta'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Name */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nome da Conta</label>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Itaú, Nubank, Dinheiro..."
                        required
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all text-lg"
                    />
                </div>

                {/* Type Selection */}
                <div className="space-y-4">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tipo de Conta</label>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { value: 'Checking', label: 'Conta Corrente', icon: <Wallet size={20} /> },
                            { value: 'Savings', label: 'Poupança / Investimento', icon: <PiggyBank size={20} /> },
                            { value: 'Credit Card', label: 'Cartão de Crédito', icon: <CreditCard size={20} /> }
                        ].map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setType(t.value as Account['type'])}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${type === t.value ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black border-zinc-900 dark:border-zinc-50 shadow-md' : 'bg-transparent border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-700'}`}
                            >
                                <div className={`${type === t.value ? 'text-zinc-100 dark:text-zinc-800' : 'text-zinc-400'}`}>
                                    {t.icon}
                                </div>
                                <span className="font-semibold">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Initial Balance */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Saldo Atual (R$)</label>
                    <input 
                        type="text"
                        value={balance}
                        onChange={(e) => setBalance(maskCurrency(e.target.value))}
                        placeholder="0,00"
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all text-2xl font-bold font-mono"
                    />
                </div>
            </form>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <button 
                    onClick={handleFormSubmit}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                >
                    <Save size={20} />
                    {isLoading ? 'Salvando...' : 'Salvar Conta'}
                </button>
            </div>
        </div>
    );
};
