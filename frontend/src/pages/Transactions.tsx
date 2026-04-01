import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/layout/DashboardLayout'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Pencil, Trash2, Search, Landmark, Tags, ArrowUp, ArrowDown } from 'lucide-react'
import { TransactionModal } from '../components/transactions/TransactionModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { toast } from '../components/ui/Toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { cn, formatDate } from '../lib/utils'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { DateFilter } from '../components/ui/DateFilter'

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  type: 'Income' | 'Expense'
  accountId: string
  categoryId: string
  categoryName?: string
  accountName?: string
  due_date?: string | null
  payment_date?: string | null
  status: 'paid' | 'pending' | 'planned'
  is_fixed: boolean | number
}

export default function Transactions() {
  const { organization } = useAuth()
  const [searchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') as 'paid' | 'pending' | 'planned' | null
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  
  // Filters & Sorting State
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    initialStatus ? new Set([initialStatus]) : new Set(['paid', 'pending', 'planned'])
  )
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set())
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement>(null)
  const [accountIdFilter, setAccountIdFilter] = useState('all')
  const [accounts, setAccounts] = useState<any[]>([])

  // Confirm State
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmPay, setConfirmPay] = useState<Transaction | null>(null)

  // Close status menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (organization) {
      fetchData()
    }
  }, [organization, selectedDate, sortBy, sortOrder, typeFilter, selectedStatuses, accountIdFilter])

  function toggleStatus(status: string) {
    setSelectedStatuses(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        if (next.size === 1) return prev // keep at least one
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  const allStatuses = ['paid', 'pending', 'planned']
  const allSelected = allStatuses.every(s => selectedStatuses.has(s))

  const statusLabels: Record<string, string> = {
    paid: '✅ Pago',
    pending: '⏳ A Pagar',
    planned: '📅 Planejado',
  }

  function getStatusButtonLabel() {
    if (allSelected) return 'Status: Todos'
    return `Status: ${[...selectedStatuses].map(s => statusLabels[s].split(' ')[1]).join(', ')}`
  }

  async function fetchData() {
    try {
      setIsLoading(true)
      // If A Pagar (pending) is selected, expand date range to show all pending regardless of month
      const hasPending = selectedStatuses.has('pending')
      const params: any = { 
        organizationId: organization.organizationId,
        startDate: (hasPending || !selectedDate) ? '2000-01-01' : format(startOfMonth(selectedDate), 'yyyy-MM-dd'),
        endDate: (hasPending || !selectedDate) ? '2100-12-31' : format(endOfMonth(selectedDate), 'yyyy-MM-dd'),
        sortBy,
        order: sortOrder,
        type: typeFilter,
        statusFilter: allSelected ? 'all' : [...selectedStatuses].join(',')
      }
      if (accountIdFilter !== 'all') {
        params.accountId = accountIdFilter;
      }
      
      const [t, c, a] = await Promise.all([
        apiService.get('transactions', params),
        apiService.get('categories', { organizationId: organization.organizationId }),
        apiService.get('accounts', { organizationId: organization.organizationId })
      ])
      
      setTransactions(t)
      setCategories(c)
      setAccounts(a)
    } catch (_error) {
      toast.error('Erro ao carregar dados.')
    } finally {
      setIsLoading(false)
    }
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(field)
      setSortOrder('ASC')
    }
  }

  function handleOpenCreate() {
    setEditingTransaction(null)
    setIsDrawerOpen(true)
  }

  function handleOpenEdit(tx: Transaction) {
    setEditingTransaction(tx)
    setIsDrawerOpen(true)
  }

  async function performDelete() {
    if (!confirmDelete) return
    try {
      await apiService.delete('transactions', confirmDelete, { 
        organizationId: organization.organizationId 
      })
      toast.success('Transação removida com sucesso!')
      setConfirmDelete(null)
      fetchData()
    } catch (_error) {
      toast.error('Não foi possível excluir a transação.')
    }
  }

  async function performPay() {
    if (!confirmPay) return
    try {
      await apiService.put('transactions', confirmPay.id, { 
        ...confirmPay, 
        status: 'paid', 
        payment_date: new Date().toISOString().split('T')[0] 
      });
      toast.success('Conta marcada como paga!');
      setConfirmPay(null);
      fetchData();
    } catch (_error) {
      toast.error('Erro ao registrar pagamento.');
    }
  }

  const visibleTransactions = transactions.filter(t => !hiddenCategories.has(t.categoryId))

  const totalIncome = visibleTransactions.filter(t => t.type.toLowerCase() === 'income').reduce((acc, t) => acc + Number(t.amount), 0)
  const totalExpense = visibleTransactions.filter(t => t.type.toLowerCase() === 'expense').reduce((acc, t) => acc + Number(t.amount), 0)
  const netTotal = totalIncome - totalExpense

  const toggleCategoryVisibility = (catId: string) => {
    setHiddenCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(catId)) {
        newSet.delete(catId)
      } else {
        newSet.add(catId)
      }
      return newSet
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20 sm:pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-app-text tracking-tight">Transações</h1>
            <p className="text-app-text-dim mt-1">Histórico de movimentações financeiras.</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="hidden lg:flex items-center gap-2 bg-app-text text-app-bg px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm"
          >
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
        <div className="flex flex-col gap-4">
          
          {/* Top Row: Date and Totals */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
              <div className="w-full sm:w-auto [&>div]:w-full [&>div]:justify-between">
                <DateFilter currentDate={selectedDate} onDateChange={setSelectedDate} />
              </div>
              <div className="h-8 w-px bg-app-soft hidden sm:block"></div>
              
              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-4 bg-app-card/60 px-3 py-3 rounded-xl flex-1 border border-app shadow-inner overflow-hidden w-full">
                <div className="flex flex-col items-center sm:items-start overflow-hidden">
                  <span className="text-[10px] text-app-text-dim uppercase font-bold tracking-wider">Receitas</span>
                  <span className="text-[11px] sm:text-sm font-black text-emerald-500 truncate w-full text-center sm:text-left" title={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
                  </span>
                </div>
                <div className="hidden sm:block h-8 w-px bg-app-soft opacity-50"></div>
                <div className="flex flex-col items-center sm:items-start overflow-hidden border-x border-app-soft/50 sm:border-0 px-1 sm:px-0">
                  <span className="text-[10px] text-app-text-dim uppercase font-bold tracking-wider">Despesas</span>
                  <span className="text-[11px] sm:text-sm font-black text-rose-500 truncate w-full text-center sm:text-left" title={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
                  </span>
                </div>
                <div className="hidden sm:block h-8 w-px bg-app-soft opacity-50"></div>
                <div className="flex flex-col items-center sm:items-start overflow-hidden">
                  <span className="text-[10px] text-app-text-dim uppercase font-bold tracking-wider">Balanço</span>
                  <span className={cn("text-[11px] sm:text-sm font-black truncate w-full text-center sm:text-left", netTotal >= 0 ? "text-sky-500" : "text-amber-500")} title={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netTotal)}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netTotal)}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={fetchData}
              className="p-2.5 text-app-text-dim hover:text-app-text hover:bg-app-soft rounded-xl transition-all self-end sm:self-auto border border-app shadow-sm"
              title="Atualizar dados"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Row: Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 bg-app-card border border-app p-1 rounded-xl shadow-sm overflow-x-auto min-w-max">
              <button
                onClick={() => setTypeFilter('all')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  typeFilter === 'all' ? "bg-app-text text-app-bg shadow-md" : "text-app-text-dim hover:text-app-text"
                )}
              >
                Ambos
              </button>
              <button
                onClick={() => setTypeFilter('income')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  typeFilter === 'income' ? "bg-emerald-500 text-white shadow-md font-black" : "text-app-text-dim hover:text-emerald-500"
                )}
              >
                Receitas
              </button>
              <button
                onClick={() => setTypeFilter('expense')}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  typeFilter === 'expense' ? "bg-rose-500 text-white shadow-md font-black" : "text-app-text-dim hover:text-rose-500"
                )}
              >
                Despesas
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-1">
              {/* Status Multi-Select */}
              <div className="relative flex-1 sm:max-w-48" ref={statusMenuRef}>
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="w-full bg-app-card text-xs font-bold text-app-text-dim hover:text-app-text outline-none px-3 py-1.5 rounded-lg border border-app cursor-pointer transition-all text-left flex justify-between items-center gap-2"
                >
                  <span className="truncate">{getStatusButtonLabel()}</span>
                  <span className="text-[8px] shrink-0">▼</span>
                </button>
                {showStatusMenu && (
                  <div className="absolute top-full mt-2 left-0 w-52 bg-app-card border border-app rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-app bg-app-soft/30">
                      <label className="flex items-center gap-2 text-xs font-bold text-app-text cursor-pointer hover:bg-app-soft px-2 py-1.5 rounded-lg transition-all">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = !allSelected && selectedStatuses.size > 0; }}
                          onChange={() => {
                            if (allSelected) {
                              setSelectedStatuses(new Set(['paid']))
                            } else {
                              setSelectedStatuses(new Set(allStatuses))
                            }
                          }}
                          className="accent-app-text cursor-pointer w-4 h-4 rounded"
                        />
                        <span>Todos os Status</span>
                      </label>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      {allStatuses.map(s => (
                        <label key={s} className="flex items-center gap-2 text-xs font-bold text-app-text-dim hover:text-app-text cursor-pointer hover:bg-app-soft px-2 py-2 rounded-lg transition-all">
                          <input
                            type="checkbox"
                            checked={selectedStatuses.has(s)}
                            onChange={() => toggleStatus(s)}
                            className="accent-app-text cursor-pointer w-4 h-4 rounded"
                          />
                          <span>{statusLabels[s]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              
              <select
                value={accountIdFilter}
                onChange={(e) => setAccountIdFilter(e.target.value)}
                className="bg-app-soft/30 text-xs font-bold text-app-text-dim hover:text-app-text outline-none px-3 py-1.5 rounded-lg border border-app cursor-pointer transition-all flex-1 sm:max-w-[140px] truncate"
              >
                <option value="all">Todas Contas</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              
              <div className="relative flex-1 sm:max-w-[170px]">
                <button
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  className="w-full bg-app-soft/30 text-xs font-bold text-app-text-dim hover:text-app-text outline-none px-3 py-1.5 rounded-lg border border-app cursor-pointer transition-all text-left flex justify-between items-center"
                >
                  <span className="truncate">Categorias ({categories.length - hiddenCategories.size}/{categories.length})</span>
                  <span className="ml-2 text-[8px]">▼</span>
                </button>
                {showCategoryMenu && (
                  <div className="absolute top-full mt-2 left-0 w-56 bg-app-card border border-app rounded-xl shadow-2xl z-50 flex flex-col max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-app bg-app-soft/30">
                       <label className="flex items-center gap-2 text-xs font-bold text-app-text cursor-pointer hover:bg-app-soft px-2 py-1.5 rounded-lg transition-all">
                         <input 
                           type="checkbox" 
                           checked={hiddenCategories.size === 0}
                           ref={(el) => { if (el) el.indeterminate = hiddenCategories.size > 0 && hiddenCategories.size < categories.length; }}
                           onChange={() => {
                              if (hiddenCategories.size === 0) {
                                setHiddenCategories(new Set(categories.map(c => c.id)))
                              } else {
                                setHiddenCategories(new Set())
                              }
                           }}
                           className="accent-app-text cursor-pointer w-4 h-4 rounded text-app-bg focus:ring-app-text"
                         />
                         <span className="truncate flex-1">Todas Categorias</span>
                       </label>
                    </div>
                    <div className="p-2 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                      {categories.map(c => (
                        <label key={c.id} className="flex items-center gap-2 text-xs font-bold text-app-text-dim hover:text-app-text cursor-pointer hover:bg-app-soft px-2 py-2 rounded-lg transition-all">
                          <input 
                            type="checkbox" 
                            checked={!hiddenCategories.has(c.id)}
                            onChange={() => toggleCategoryVisibility(c.id)}
                            className="accent-app-text cursor-pointer w-4 h-4 rounded text-app-bg focus:ring-app-text"
                          />
                          <span className="truncate flex-1">{c.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-app-card border border-app rounded-3xl overflow-hidden transition-all duration-500 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-app">
                    <th 
                      className="px-6 py-4 text-xs font-bold text-app-text-dim uppercase cursor-pointer hover:text-app-text transition-colors"
                      onClick={() => toggleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Data {sortBy === 'date' && (sortOrder === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-xs font-bold text-app-text-dim uppercase cursor-pointer hover:text-app-text transition-colors"
                      onClick={() => toggleSort('description')}
                    >
                      <div className="flex items-center gap-1">
                        Descrição {sortBy === 'description' && (sortOrder === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-app-text-dim uppercase">Conta/Categoria</th>
                    <th className="px-6 py-4 text-xs font-bold text-app-text-dim uppercase">Status/Venc.</th>
                    <th 
                      className="px-6 py-4 text-xs font-bold text-app-text-dim uppercase text-right cursor-pointer hover:text-app-text transition-colors"
                      onClick={() => toggleSort('amount')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Valor {sortBy === 'amount' && (sortOrder === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-app-text-dim uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                         <LoadingSpinner size="md" label="Carregando transações..." />
                      </td>
                    </tr>
                  ) : visibleTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                         <Search className="w-12 h-12 text-app-text-dim mx-auto mb-4" />
                         <p className="text-app-text-dim">Nenhuma transação encontrada.</p>
                      </td>
                    </tr>
                  ) : (
                    visibleTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-app-soft/30 transition-colors group">
                        <td className="px-6 py-4 text-sm text-app-text-dim font-mono">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-app-text">{tx.description}</span>
                            <span className={`text-[10px] font-bold uppercase ${tx.type.toLowerCase() === 'income' ? 'text-app-income' : 'text-app-expense'}`}>
                              {tx.type.toLowerCase() === 'income' ? 'Receita' : 'Despesa'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-app-text-dim font-medium">
                               <Landmark size={12} className="opacity-60" />
                               {tx.accountName || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-app-text-dim">
                               <Tags size={12} style={{ color: categories.find(c => c.id === tx.categoryId)?.color }} />
                               {tx.categoryName || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tx.due_date ? (
                            <div className="flex flex-col gap-1">
                              <span className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5 rounded-full w-fit",
                                tx.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" : 
                                (new Date(tx.due_date) < new Date() ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500")
                              )}>
                                {tx.status === 'paid' ? 'Pago' : 
                                 (tx.status === 'planned' ? 'Planejado' : 
                                 (new Date(tx.due_date!) < new Date() ? 'Atrasado' : 'A Pagar'))}
                              </span>
                              <span className="text-[10px] text-app-text-dim font-bold">
                                Vence {formatDate(tx.due_date)}
                              </span>
                              {tx.status === 'paid' && tx.payment_date && (
                                <span className="text-[10px] text-emerald-500 font-bold">
                                  Pago em {formatDate(tx.payment_date)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-app-text-dim font-medium">Sem vencimento</span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-sm font-black text-right whitespace-nowrap ${tx.type.toLowerCase() === 'income' ? 'text-app-income' : 'text-app-expense'}`}>
                          {new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            signDisplay: 'always'
                          }).format(tx.type.toLowerCase() === 'income' ? tx.amount : -tx.amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {(tx.status === 'pending' || tx.status === 'planned') && (
                              <button 
                                onClick={() => setConfirmPay(tx)}
                                className="p-2 text-emerald-500 hover:bg-emerald-500/10 transition-colors rounded-lg flex items-center gap-1 text-[10px] font-black uppercase"
                              >
                                Pagar
                              </button>
                            )}
                            <button onClick={() => handleOpenEdit(tx)} className="p-2 text-app-text-dim hover:text-app-text transition-colors bg-app-bg/50 sm:bg-transparent rounded-lg">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => setConfirmDelete(tx.id)} className="p-2 text-app-text-dim hover:text-red-400 transition-colors bg-app-bg/50 sm:bg-transparent rounded-lg">
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
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {isLoading ? (
              <div className="py-20 flex justify-center">
                <LoadingSpinner size="md" label="Carregando..." />
              </div>
            ) : visibleTransactions.length === 0 ? (
              <div className="py-20 text-center bg-app-card border border-app rounded-3xl">
                 <Search className="w-12 h-12 text-app-text-dim mx-auto mb-4 opacity-20" />
                 <p className="text-app-text-dim">Nenhuma transação encontrada.</p>
              </div>
            ) : (
              visibleTransactions.map(tx => (
                <div key={tx.id} className="bg-app-card border border-app rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden group">
                  {/* Accent Line for Type */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${tx.type.toLowerCase() === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 pl-2">
                       <p className="text-[10px] font-mono text-app-text-dim">{formatDate(tx.date)}</p>
                       <h3 className="text-sm font-bold text-app-text leading-tight">{tx.description}</h3>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${tx.type.toLowerCase() === 'income' ? 'text-app-income' : 'text-app-expense'}`}>
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          signDisplay: 'always'
                        }).format(tx.type.toLowerCase() === 'income' ? tx.amount : -tx.amount)}
                      </p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${tx.type.toLowerCase() === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {tx.type.toLowerCase() === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pl-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-app-text-dim font-medium bg-app-soft px-2 py-1 rounded-lg">
                       <Landmark size={10} className="opacity-60" />
                       {tx.accountName || 'N/A'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-app-text-dim font-medium bg-app-soft px-2 py-1 rounded-lg">
                       <Tags size={10} style={{ color: categories.find(c => c.id === tx.categoryId)?.color }} />
                       {tx.categoryName || 'N/A'}
                    </div>
                  </div>

                  {tx.due_date && (
                    <div className="flex items-center justify-between pl-2 pt-2 border-t border-app">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-app-text-dim font-bold">Vencimento</span>
                        <span className="text-[10px] text-app-text font-black">{formatDate(tx.due_date)}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-xl",
                        tx.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" : 
                        (new Date(tx.due_date) < new Date() ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500")
                      )}>
                         {tx.status === 'paid' ? 'Pago' : 
                          (tx.status === 'planned' ? 'Planejado' : 
                          (new Date(tx.due_date!) < new Date() ? 'Atrasado' : 'A Pagar'))}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {(tx.status === 'pending' || tx.status === 'planned') && (
                      <button 
                        onClick={() => setConfirmPay(tx)}
                        className="p-2 text-emerald-500 hover:bg-emerald-400 font-black text-[10px] uppercase tracking-wider"
                      >
                        Pagar
                      </button>
                    )}
                    <button onClick={() => handleOpenEdit(tx)} className="p-2.5 bg-app-soft text-app-text rounded-xl active:scale-95 transition-all">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmDelete(tx.id)} className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl active:scale-95 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) for Mobile Dashboard feel in Transactions too */}
      <button
        onClick={handleOpenCreate}
        className="lg:hidden fixed bottom-8 right-6 w-16 h-16 bg-app-text text-app-bg rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-50 border-4 border-app"
        aria-label="Novo Lançamento"
      >
        <Plus size={32} />
      </button>

      <TransactionModal 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={fetchData}
        transaction={editingTransaction}
      />

      <ConfirmDialog isOpen={!!confirmDelete} title="Excluir Transação"
        message="Deseja excluir permanentemente este lançamento? O valor será estornado do seu painel e relatórios."
        confirmLabel="Excluir" variant="danger" onConfirm={performDelete}
        onClose={() => setConfirmDelete(null)}
      />

      <ConfirmDialog isOpen={!!confirmPay} title="Confirmar Pagamento"
        message={`Deseja marcar "${confirmPay?.description}" como pago hoje? Isso atualizará o status para "Pago" em seus controles.`}
        confirmLabel="Sim, Pago" variant="success" onConfirm={performPay}
        onClose={() => setConfirmPay(null)}
      />
    </DashboardLayout>
  )
}
