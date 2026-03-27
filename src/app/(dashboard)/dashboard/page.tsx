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
        color: 'bg-accent text-white border-2 border-accent shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]',
        icon: <Wallet className="w-5 h-5" />
    },
    { 
        label: 'Receitas (Mês)', 
        value: formatCurrency(summary.monthlyIncome), 
        change: summary.incomeChange, 
        color: 'bg-card border-2 border-foreground text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]',
        icon: <ArrowUpRight className="w-5 h-5" />
    },
    { 
        label: 'Despesas (Mês)', 
        value: formatCurrency(summary.monthlyExpenses), 
        change: summary.expenseChange, 
        color: 'bg-card border-2 border-foreground text-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]',
        icon: <ArrowDownRight className="w-5 h-5" />
    },
  ];

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground italic">Visão Geral</h1>
          <p className="text-foreground/70 font-bold mt-2 uppercase text-xs tracking-widest">Controle financeiro em estado sólido</p>
        </div>
        <Link 
            href="/transactions"
            className="flex items-center justify-center gap-3 px-8 py-4 bg-accent text-white font-black uppercase tracking-tighter rounded-sm hover:-translate-y-1 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] border-2 border-accent"
        >
            <ReceiptText size={24} />
            Transações
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.label} className={cn(
            "p-8 rounded-sm flex flex-col gap-6 transition-all hover:-translate-y-1",
            card.color
          )}>
            <div className="flex items-center justify-between opacity-80 border-b border-current/20 pb-4">
                <span className="text-xs font-black uppercase tracking-widest">{card.label}</span>
                {card.icon}
            </div>
            <div className="flex items-end justify-between">
                <span className="text-4xl font-black tracking-tighter italic">{card.value}</span>
                <span className="text-xs font-black px-3 py-1 rounded-sm border-2 border-current">
                    {card.change}
                </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
         {/* Recent Activity */}
         <div className="lg:col-span-4 p-8 rounded-sm border-2 border-foreground bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-foreground/10">
                <div className="flex items-center gap-3">
                    <History className="w-6 h-6 text-accent" />
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Atividade Recente</h3>
                </div>
                <Link href="/transactions" className="text-xs font-black uppercase tracking-widest text-foreground/50 hover:text-accent transition-colors">
                    Ver todas →
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
         <div className="lg:col-span-3 p-8 rounded-sm border-2 border-foreground bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] flex flex-col gap-6">
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
         <div className="lg:col-span-4 p-8 rounded-sm border-2 border-foreground bg-card shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
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
