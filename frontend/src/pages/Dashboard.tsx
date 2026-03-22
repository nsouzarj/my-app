import { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { apiService } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatDate } from '../lib/utils';
import { TrendingUp, TrendingDown, Wallet, Landmark, ArrowRight, PieChart as PieChartIcon, BarChart3, CalendarDays, AlertCircle, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TransactionModal } from '../components/transactions/TransactionModal';

export default function Dashboard() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!isLoading && summary && (!summary.accounts || summary.accounts.length === 0)) {
      navigate('/accounts');
    }
  }, [isLoading, summary, navigate]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  async function fetchDashboard() {
    try {
      setIsLoading(true);
      const [year, month] = filterMonth.split('-');
      const data = await apiService.get('dashboard', { 
        organizationId: organization?.organizationId,
        month,
        year,
        _t: Date.now()
      });
      setSummary(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (organization) fetchDashboard();
  }, [organization, filterMonth]);

  const monthlyBalance = (summary?.income || 0) - (summary?.expenses || 0);

  const cards = [
    { 
      name: 'Receitas (Mês)', 
      value: summary?.income || 0, 
      icon: TrendingUp, 
      color: 'text-emerald-100',
      bgColor: 'bg-emerald-600',
      borderColor: 'border-emerald-500'
    },
    { 
      name: 'Despesas (Mês)', 
      value: summary?.expenses || 0, 
      icon: TrendingDown, 
      color: 'text-rose-100',
      bgColor: 'bg-rose-600',
      borderColor: 'border-rose-500'
    },
    { 
      name: 'Resultado (Mês)', 
      value: monthlyBalance, 
      icon: Wallet, 
      color: monthlyBalance >= 0 ? 'text-sky-100' : 'text-amber-100',
      bgColor: monthlyBalance >= 0 ? 'bg-sky-600' : 'bg-amber-600',
      borderColor: monthlyBalance >= 0 ? 'border-sky-500' : 'border-amber-500'
    },
    { 
      name: 'Saldo Geral', 
      value: summary?.totalBalance || 0, 
      icon: Landmark, 
      color: 'text-indigo-100',
      bgColor: 'bg-indigo-600',
      borderColor: 'border-indigo-500'
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" label="Preparando seu painel financeiro..." />
        </div>
      </DashboardLayout>
    );
  }

  const months = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];
  const currentSystemYear = new Date().getFullYear();
  const years = Array.from({length: 11}, (_, i) => currentSystemYear - 5 + i);

  const [selectedYear, selectedMonth] = filterMonth.split('-');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-app-text tracking-tight">Painel</h1>
            <p className="text-app-text-dim mt-1">Bem-vindo de volta! Aqui está um resumo das suas finanças.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <button
               onClick={() => setIsModalOpen(true)}
               className="hidden lg:flex items-center gap-2 bg-app-text text-app-bg px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm"
            >
              <Plus size={16} /> Novo Lançamento
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-app-text-dim">Mês:</span>
              <div className="flex items-center gap-2">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setFilterMonth(`${selectedYear}-${e.target.value}`)}
                  className="bg-app border border-app rounded-xl px-3 py-2 text-sm text-app-text focus:outline-none focus:border-app-accent cursor-pointer"
                >
                  {months.map(m => <option key={m.value} value={m.value} className="bg-app-card text-app-text">{m.label}</option>)}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setFilterMonth(`${e.target.value}-${selectedMonth}`)}
                  className="bg-app border border-app rounded-xl px-3 py-2 text-sm text-app-text focus:outline-none focus:border-app-accent cursor-pointer"
                >
                  {years.map(y => <option key={y} value={y} className="bg-app-card text-app-text">{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div 
              key={card.name} 
              className={cn(
                "p-6 rounded-3xl border shadow-lg transition-all duration-300 group hover:scale-[1.02]",
                card.bgColor,
                card.borderColor
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-white/80 uppercase tracking-widest">{card.name}</span>
                <div className={cn("p-2 rounded-xl bg-white/20", card.color)}>
                  <card.icon size={20} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-white tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.value)}
                </span>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">Status: {card.name === 'Saldo do Mês' ? (card.value >= 0 ? 'Positivo' : 'Negativo') : 'Confirmado'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Donut Chart - Expenses by Category */}
           <div className="lg:col-span-1 bg-app-card border border-app rounded-2xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon size={18} className="text-app-accent" />
                <h3 className="text-lg font-bold text-app-text">Gastos por Categoria</h3>
              </div>
              
              <div className="flex-1 min-h-[250px] relative">
                {!summary?.categoryBreakdown?.length ? (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-app-text-dim italic text-center px-4">
                    Nenhum gasto registrado este mês para gerar o gráfico.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {summary.categoryBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-app-card)', 
                          border: '1px solid var(--color-app-border)',
                          borderRadius: '12px',
                          color: 'var(--color-app-text)',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: 'var(--color-app-text)' }}
                        formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                {summary?.categoryBreakdown?.map((cat: any) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-app-text-dim font-medium truncate max-w-[120px]">{cat.name}</span>
                    </div>
                    <span className="text-app-text font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.value)}
                    </span>
                  </div>
                ))}
              </div>
           </div>

           {/* Cash Flow Chart */}
           <div className="lg:col-span-2 bg-app-card border border-app rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-app-accent" />
                  <div>
                    <h3 className="text-lg font-bold text-app-text">Fluxo de Caixa</h3>
                    <p className="text-[10px] text-app-text-dim uppercase tracking-wider font-bold">Receitas vs Despesas (Mensal)</p>
                  </div>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[
                      { name: 'Início', income: 0, expense: 0 },
                      { name: 'Atual', income: summary?.monthlyIncome || 0, expense: summary?.monthlyExpenses || 0 }
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-app-border)" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-app-text-dim)', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-app-text-dim)', fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--color-app-card)', 
                        border: '1px solid var(--color-app-border)',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))}
                    />
                    <Area type="monotone" dataKey="income" name="Receitas" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} animationDuration={1500} />
                    <Area type="monotone" dataKey="expense" name="Despesas" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Pending Bills Smart Widget */}
        {summary?.pendingBills?.count > 0 && (
          <div className={cn(
            "bg-app-card border p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6",
            summary.pendingBills.overdueCount > 0 ? "border-rose-500/30 bg-rose-500/5" : "border-amber-500/30 bg-amber-500/5"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-2xl",
                summary.pendingBills.overdueCount > 0 ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-500"
              )}>
                {summary.pendingBills.overdueCount > 0 ? <AlertCircle size={24} /> : <CalendarDays size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-app-text">
                  {summary.pendingBills.overdueCount > 0 
                    ? `${summary.pendingBills.overdueCount} Contas Atrasadas!` 
                    : `${summary.pendingBills.count} Contas Pendentes`}
                </h3>
                <p className="text-sm text-app-text-dim">
                  Total a pagar: <span className="font-bold text-app-text">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.pendingBills.total)}
                  </span>
                </p>
              </div>
            </div>
            <Link 
              to="/transactions?status=pending" 
              className={cn(
                "px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                summary.pendingBills.overdueCount > 0 ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-amber-500 text-white hover:bg-amber-600"
              )}
            >
              Ver e Pagar Agora <ArrowRight size={16} />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Recent Transactions */}
           <div className="bg-app-card border border-app rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-app-text">Transações Recentes</h3>
                <Link to="/transactions" className="text-sm text-app-text-dim hover:text-app-text flex items-center gap-1">
                  Ver todas <ArrowRight size={14} />
                </Link>
              </div>
              
              <div className="space-y-4">
                {!summary?.recentTransactions?.length ? (
                  <div className="text-sm text-app-text-dim text-center py-10 border border-dashed border-app rounded-xl">
                    Nenhuma transação recente encontrada.
                  </div>
                ) : (
                  summary.recentTransactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-app-soft/50 rounded-xl transition-colors">
                      <div className="flex items-center gap-4">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${tx.categoryColor || (tx.type.toLowerCase() === 'income' ? '#10b981' : '#ef4444')}20`, color: tx.categoryColor || (tx.type.toLowerCase() === 'income' ? '#10b981' : '#ef4444') }}
                        >
                          {tx.type.toLowerCase() === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-app-text leading-tight">{tx.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-app-text-dim uppercase tracking-wider font-bold">{tx.accountName || 'Geral'}</p>
                            <span className="w-1 h-1 bg-app-soft rounded-full"></span>
                            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ fontSize: '9px', color: tx.categoryColor }}>{tx.categoryName}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className={`text-sm font-black ${tx.type.toLowerCase() === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            signDisplay: 'always'
                          }).format(tx.type.toLowerCase() === 'income' ? tx.amount : -tx.amount)}
                        </p>
                        <p className="text-[10px] text-app-text-dim font-mono mt-0.5">
                          {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
           </div>
           
           {/* Accounts List */}
           <div className="bg-app-card border border-app rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-app-text">Suas Contas</h3>
                <Link to="/accounts" className="text-sm text-app-text-dim hover:text-app-text flex items-center gap-1">
                  Gerenciar <ArrowRight size={14} />
                </Link>
              </div>
              
              <div className="space-y-4">
                {!summary?.accounts?.length ? (
                  <div className="text-sm text-app-text-dim text-center py-10 border border-dashed border-app rounded-xl">
                    Nenhuma conta cadastrada.
                  </div>
                ) : (
                  summary.accounts.map((acc: any) => {
                    return (
                      <div key={acc.id} className="flex items-center justify-between p-3 bg-app-soft/20 border border-app rounded-xl group hover:border-app-accent/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg text-white shadow-sm" style={{ backgroundColor: acc.color || '#3b82f6' }}>
                            <Landmark size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-app-text">{acc.name}</p>
                            <p className="text-[10px] text-app-text-dim uppercase tracking-wider font-bold mt-0.5">Saldo atual</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-app-text">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acc.balance)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) for Mobile */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="lg:hidden fixed bottom-8 right-6 w-16 h-16 bg-app-text text-app-bg rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-50 border-4 border-app"
        aria-label="Novo Lançamento"
      >
        <Plus size={32} />
      </button>

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDashboard}
      />
    </DashboardLayout>
  );
}
