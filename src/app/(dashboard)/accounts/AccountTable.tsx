'use client';

import React from 'react';
import { Account } from '@/domain/entities/Account';
import { Pencil, Trash2, Wallet, CreditCard, PiggyBank } from 'lucide-react';

interface AccountTableProps {
    accounts: Account[];
    onEdit: (account: Account) => void;
    onDelete: (id: string) => void;
}

const getTypeIcon = (type: Account['type']) => {
    switch (type) {
        case 'Checking': return <Wallet size={18} />;
        case 'Credit Card': return <CreditCard size={18} />;
        case 'Savings': return <PiggyBank size={18} />;
        default: return <Wallet size={18} />;
    }
};

const getTypeLabel = (type: Account['type']) => {
    switch (type) {
        case 'Checking': return 'Conta Corrente';
        case 'Credit Card': return 'Cartão de Crédito';
        case 'Savings': return 'Poupança';
        default: return type;
    }
};

export const AccountTable: React.FC<AccountTableProps> = ({ accounts, onEdit, onDelete }) => {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-bottom border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                            <th className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Nome</th>
                            <th className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Tipo</th>
                            <th className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">Saldo</th>
                            <th className="px-6 py-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {accounts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                                    Nenhuma conta encontrada.
                                </td>
                            </tr>
                        ) : (
                            accounts.map((account) => (
                                <tr key={account.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                        {account.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                            {getTypeIcon(account.type)}
                                            <span className="text-sm">{getTypeLabel(account.type)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-bold ${account.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => onEdit(account)}
                                                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button 
                                                onClick={() => onDelete(account.id)}
                                                className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
