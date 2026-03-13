'use client';
import React from 'react';
import { Transaction } from '@/domain/entities/Transaction';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { Category } from '@/domain/entities/Category';
import { Account } from '@/domain/entities/Account';

interface TransactionTableProps {
    transactions: (Transaction & { category?: Category; account?: Account })[];
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onEdit, onDelete }) => {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-medium">
                    <tr>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Descrição</th>
                        <th className="px-6 py-4">Categoria</th>
                        <th className="px-6 py-4">Conta</th>
                        <th className="px-6 py-4 text-right">Valor</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {transactions.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-zinc-500">
                                Nenhuma transação encontrada.
                            </td>
                        </tr>
                    ) : (
                        transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                                    {format(new Date(transaction.date), 'dd MMM, yyyy', { locale: ptBR })}
                                </td>
                                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                                    {transaction.description}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                                        {transaction.category?.name || 'Sem Categoria'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                    {transaction.account?.name || 'Conta Padrão'}
                                </td>
                                <td className={`px-6 py-4 text-right font-semibold ${transaction.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    <div className="flex items-center justify-end gap-1.5">
                                        {transaction.type === 'Income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => onEdit(transaction)}
                                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(transaction.id)}
                                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-zinc-500 hover:text-rose-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
