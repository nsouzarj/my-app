'use client';

import { ReceiptText, ArrowUpRight, ArrowDownRight, Wallet, History, Plus } from "lucide-react"
import { cn } from "@/infrastructure/ui/utils"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CategoryChart } from "@/infrastructure/ui/CategoryChart"
import { useState, useEffect } from "react"
import { apiService } from "@/infrastructure/services/apiService"
import { useAuth } from "@clerk/nextjs"

export default function DashboardPage() {
  const { userId } = useAuth();
  const organizationId = userId || 'default_org';
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await apiService.get('dashboard', organizationId);
        setSummary(data);
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [organizationId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  if (loading || !summary) {
    return <div className="p-10 flex items-center justify-center min-h-[400px]">Carregando resumo...</div>;
  }

  const cards = [
    { 
        label: 'Saldo Total', 
        value: formatCurrency(summary.totalBalance), 
        change: summary.balanceChange, 
        color: 'bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black',
        icon: <Wallet className="w-4 h-4" />
    },
    { 
        label: 'Receitas (Mês)', 
        value: formatCurrency(summary.monthlyIncome), 
        change: summary.incomeChange, 
        color: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-emerald-600',
        icon: <ArrowUpRight className="w-4 h-4" />
    },
    { 
        label: 'Despesas (Mês)', 
        value: formatCurrency(summary.monthlyExpenses), 
        change: summary.expenseChange, 
        color: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-red-600',
        icon: <ArrowDownRight className="w-4 h-4" />
    },
  ];

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Visão Geral</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Bem-vindo de volta! Aqui está o resumo das suas finanças.</p>
        </div>
        <Link 
            href="/transactions"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-lg"
        >
            <ReceiptText size={20} />
            Transações
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className={cn(
            "p-6 rounded-2xl flex flex-col gap-4 transition-all hover:scale-[1.02] shadow-sm",
            card.color
          )}>
            <div className="flex items-center justify-between opacity-80">
                <span className="text-sm font-semibold uppercase tracking-wider">{card.label}</span>
                {card.icon}
            </div>
            <div className="flex items-end justify-between">
                <span className="text-2xl font-bold">{card.value}</span>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-black/10 dark:bg-white/10">
                    {card.change}
                </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
         {/* Recent Activity */}
         <div className="lg:col-span-4 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-zinc-400" />
                    <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Atividade Recente</h3>
                </div>
                <Link href="/transactions" className="text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                    Ver todas
                </Link>
            </div>
            <div className="space-y-6">
                {summary.recentTransactions.length === 0 ? (
                    <div className="text-center py-10 opacity-50">Nenhuma transação recente.</div>
                ) : (
                    summary.recentTransactions.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                    t.type === 'Income' ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600' : 'bg-red-50 dark:bg-red-900/10 text-red-600'
                                )}>
                                    {t.type === 'Income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{t.description}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-400 font-medium">
                                            {t.accountName}
                                        </span>
                                        <span className="text-[10px] text-zinc-300">•</span>
                                        <span className="text-xs text-zinc-500 font-medium capitalize">
                                            {format(t.date, "dd 'de' MMM", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span className={cn(
                                "text-sm font-bold",
                                t.type === 'Income' ? 'text-emerald-600' : 'text-red-600'
                            )}>
                                {t.type === 'Income' ? '+' : '-'} {formatCurrency(t.amount)}
                            </span>
                        </div>
                    ))
                )}
            </div>
         </div>

         {/* Account Breakdown */}
         <div className="lg:col-span-3 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm flex flex-col gap-6">
             <div className="flex items-center gap-2">
                 <Wallet className="w-5 h-5 text-zinc-400" />
                 <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Minhas Contas</h3>
             </div>
             <div className="space-y-4">
                 {summary.accounts.map((acc: any) => (
                     <div key={acc.id} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
                         <div className="flex flex-col">
                             <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{acc.name}</span>
                             <span className="text-xs text-zinc-500">{acc.type}</span>
                         </div>
                         <span className={cn(
                             "text-sm font-bold",
                             acc.balance >= 0 ? "text-zinc-900 dark:text-zinc-50" : "text-red-500"
                         )}>
                             {formatCurrency(acc.balance)}
                         </span>
                     </div>
                 ))}
             </div>
             <Link 
                href="/accounts"
                className="mt-2 text-center text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors"
             >
                 Gerenciar todas as contas
             </Link>
         </div>

         {/* Category Chart */}
         <div className="lg:col-span-4 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
             <div className="flex items-center gap-2 mb-8">
                 <History className="w-5 h-5 text-zinc-400" />
                 <h3 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">Distribuição de Gastos</h3>
             </div>
             <CategoryChart data={summary.categoryBreakdown} />
         </div>
      </div>
    </div>
  )
}
