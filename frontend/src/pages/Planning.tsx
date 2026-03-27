import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react'
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
  reminderDays?: number | null
}

export default function Planning() {
  const { organization } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [_accounts, setAccounts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const sortBy = 'date'
  const sortOrder = 'ASC'
  const typeFilter = 'all'

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (organization) {
      fetchData()
    }
  }, [organization, selectedDate, sortBy, sortOrder, typeFilter])

  async function fetchData() {
    try {
      setIsLoading(true)
      const params: any = { 
        organizationId: organization.organizationId,
        // No planejamento, mostramos um período longo por padrão ou o mês selecionado
        startDate: selectedDate ? format(startOfMonth(selectedDate), 'yyyy-MM-dd') : '2000-01-01',
        endDate: selectedDate ? format(endOfMonth(selectedDate), 'yyyy-MM-dd') : '2100-12-31',
        sortBy,
        order: sortOrder,
        type: typeFilter,
        statusFilter: 'planned' // <--- FORÇADO PARA PLANEJAMENTO
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
      toast.error('Erro ao carregar planejamento.')
    } finally {
      setIsLoading(false)
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
      await apiService.delete('transactions', confirmDelete, { organizationId: organization.organizationId })
      toast.success('Previsão removida!')
      setConfirmDelete(null)
      fetchData()
    } catch (_error) {
      toast.error('Erro ao excluir.')
    }
  }

  function handleConfirm(tx: Transaction) {
    setEditingTransaction({
      ...tx,
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0]
    })
    setIsDrawerOpen(true)
  }

  const totalPlanned = transactions.reduce((acc, t) => acc + (t.type.toLowerCase() === 'expense' ? -t.amount : t.amount), 0)

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20 sm:pb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-app-text tracking-tight flex items-center gap-3">
              <Calendar className="text-app-accent" size={32} />
              Planejamento Futuro
            </h1>
            <p className="text-app-text-dim mt-1">Estimativas e previsões que não afetam seu saldo real.</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-app-accent text-white px-6 py-3 rounded-2xl font-black hover:opacity-90 transition-all shadow-xl shadow-app-accent/20 text-sm uppercase tracking-widest"
          >
            <Plus size={18} /> Nova Previsão
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <div className="lg:col-span-3 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-app-card border border-app p-4 rounded-3xl">
                 <DateFilter currentDate={selectedDate} onDateChange={setSelectedDate} />
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-app-text-dim uppercase tracking-wider">Total Previsto:</span>
                    <span className={cn("text-lg font-black", totalPlanned >= 0 ? "text-emerald-500" : "text-rose-500")}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPlanned)}
                    </span>
                 </div>
              </div>

              <div className="bg-app-card border border-app rounded-3xl overflow-hidden shadow-sm">
                <div className="hidden lg:block">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-app bg-app-soft/20">
                        <th className="px-4 py-3 text-[10px] font-black text-app-text-dim uppercase tracking-widest">Data Prevista</th>
                        <th className="px-4 py-3 text-[10px] font-black text-app-text-dim uppercase tracking-widest">Descrição</th>
                        <th className="px-4 py-3 text-[10px] font-black text-app-text-dim uppercase tracking-widest">Categoria</th>
                        <th className="px-4 py-3 text-[10px] font-black text-app-text-dim uppercase tracking-widest text-right">Valor</th>
                        <th className="px-4 py-3 text-[10px] font-black text-app-text-dim uppercase tracking-widest text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app">
                      {isLoading ? (
                        <tr><td colSpan={5} className="py-20 text-center"><LoadingSpinner size="md" /></td></tr>
                      ) : transactions.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center text-app-text-dim">Nenhuma previsão para este período.</td></tr>
                      ) : (
                        transactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-app-soft/10 transition-colors group">
                            <td className="px-4 py-3 text-sm font-bold text-app-text-dim">{formatDate(tx.date)}</td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-black text-app-text block">{tx.description}</span>
                              {tx.reminderDays && (
                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-500/10 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                                  Alerta: {tx.reminderDays} dias antes
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                               <div className="flex items-center gap-2 text-xs text-app-text-dim">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categories.find(c => c.id === tx.categoryId)?.color }}></span>
                                  {tx.categoryName}
                               </div>
                            </td>
                            <td className={cn("px-4 py-3 text-sm font-black text-right", tx.type.toLowerCase() === 'income' ? "text-emerald-500" : "text-rose-500")}>
                               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.type.toLowerCase() === 'expense' ? -tx.amount : tx.amount)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleConfirm(tx)}
                                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all"
                                >
                                  Confirmar
                                </button>
                                <button onClick={() => handleOpenEdit(tx)} className="p-2 text-app-text-dim hover:text-app-text"><Pencil size={14} /></button>
                                <button onClick={() => setConfirmDelete(tx.id)} className="p-2 text-app-text-dim hover:text-rose-500"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View - Cards */}
                <div className="lg:hidden divide-y divide-app">
                  {isLoading ? (
                    <div className="py-20 text-center"><LoadingSpinner size="md" /></div>
                  ) : transactions.length === 0 ? (
                    <div className="py-20 text-center text-app-text-dim px-6">Nenhuma previsão para este período.</div>
                  ) : (
                    transactions.map(tx => (
                      <div key={tx.id} className="p-5 space-y-4 hover:bg-app-soft/10 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-app-text-dim uppercase tracking-widest">{formatDate(tx.date)}</span>
                            <h4 className="text-base font-black text-app-text">{tx.description}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-app-text-dim uppercase font-black tracking-widest">
                               <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categories.find(c => c.id === tx.categoryId)?.color }}></span>
                               {tx.categoryName}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={cn("text-lg font-black block", tx.type.toLowerCase() === 'income' ? "text-emerald-500" : "text-rose-500")}>
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.type.toLowerCase() === 'expense' ? -tx.amount : tx.amount)}
                            </span>
                            {tx.reminderDays && (
                              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-500/10 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                                Alerta {tx.reminderDays}d
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <button 
                            onClick={() => handleConfirm(tx)}
                            className="col-span-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                          >
                            Baixar
                          </button>
                          <button 
                            onClick={() => handleOpenEdit(tx)} 
                            className="flex items-center justify-center gap-2 py-3 bg-app-soft/20 text-app-text rounded-xl text-[10px] font-black uppercase hover:bg-app-soft/40 transition-all font-black"
                          >
                            <Pencil size={12} /> Editar
                          </button>
                          <button 
                            onClick={() => setConfirmDelete(tx.id)} 
                            className="flex items-center justify-center gap-2 py-3 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all font-black"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-app-accent/10 border border-app-accent/20 rounded-3xl p-6">
                <h3 className="font-black text-app-accent uppercase tracking-widest text-xs mb-4">Dica de Planejamento</h3>
                <p className="text-sm text-app-text leading-relaxed">
                  As transações nesta tela servem apenas como **previsão**. Elas aparecem no seu Dashboard como alertas de vencimento, mas o saldo das suas contas só será alterado quando você clicar em **"Confirmar"**.
                </p>
              </div>
           </div>
        </div>
      </div>

      <TransactionModal 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={fetchData}
        transaction={editingTransaction}
      />

      <ConfirmDialog isOpen={!!confirmDelete} title="Excluir Previsão"
        message="Deseja remover este planejamento?"
        confirmLabel="Excluir" variant="danger" onConfirm={performDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </DashboardLayout>
  )
}
