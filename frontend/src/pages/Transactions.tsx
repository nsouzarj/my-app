import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Pencil, Trash2, Search, Landmark, Tags, ArrowUp, ArrowDown } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { toast } from '../components/ui/Toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { cn } from '../lib/utils'
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
  status: 'paid' | 'pending'
  is_fixed: boolean | number
}

export default function Transactions() {
  const { organization } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  
  // Form State
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('0')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<'Income' | 'Expense'>('Expense')
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [status, setStatus] = useState<'paid' | 'pending'>('paid')
  const [isFixed, setIsFixed] = useState(false)

  // Filters & Sorting State
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  // Confirm State (Restored)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmPay, setConfirmPay] = useState<Transaction | null>(null)
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false)

  useEffect(() => {
    if (organization) fetchData()
  }, [organization, selectedDate, sortBy, sortOrder])

  async function fetchData() {
    try {
      setIsLoading(true)
      const params: any = { 
        organizationId: organization.organizationId,
        startDate: format(startOfMonth(selectedDate), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(selectedDate), 'yyyy-MM-dd'),
        sortBy,
        order: sortOrder
      }
      
      const [t, a, c] = await Promise.all([
        apiService.get('transactions', params),
        apiService.get('accounts', { organizationId: organization.organizationId }),
        apiService.get('categories', { organizationId: organization.organizationId })
      ])
      
      setTransactions(t)
      setAccounts(a)
      setCategories(c)
      
      if (a.length > 0 && !accountId) setAccountId(a[0].id)
      if (c.length > 0 && !categoryId) setCategoryId(c[0].id)
    } catch (error) {
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
    setDescription('')
    setAmount('0')
    setDate(new Date().toISOString().split('T')[0])
    setType('Expense')
    setDueDate('')
    setPaymentDate('')
    setStatus('paid')
    setIsFixed(false)
    if (accounts.length > 0) setAccountId(accounts[0].id)
    if (categories.length > 0) setCategoryId(categories[0].id)
    setIsDrawerOpen(true)
  }

  function handleOpenEdit(tx: Transaction) {
    setEditingTransaction(tx)
    setDescription(tx.description)
    setAmount(tx.amount.toString())
    setDate(new Date(tx.date).toISOString().split('T')[0])
    setType(tx.type)
    setAccountId(tx.accountId)
    setCategoryId(tx.categoryId)
    setDueDate(tx.due_date ? new Date(tx.due_date).toISOString().split('T')[0] : '')
    setPaymentDate(tx.payment_date ? new Date(tx.payment_date).toISOString().split('T')[0] : '')
    setStatus(tx.status || 'paid')
    setIsFixed(tx.is_fixed === 1 || tx.is_fixed === true)
    setIsDrawerOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsConfirmSaveOpen(true)
  }

  async function performSave() {
    setIsConfirmSaveOpen(false)
    try {
      const cleanAmount = amount.replace(/\./g, '').replace(',', '.')
      const payload = {
        description,
        amount: parseFloat(cleanAmount),
        date,
        type,
        accountId,
        categoryId,
        organizationId: organization.organizationId,
        due_date: dueDate || null,
        payment_date: paymentDate || null,
        status,
        is_fixed: isFixed ? 1 : 0
      }

      if (editingTransaction) {
        await apiService.put('transactions', editingTransaction.id, payload)
        toast.success('Transação atualizada!')
      } else {
        await apiService.post('transactions', payload)
        toast.success('Lançamento realizado!')
      }
      
      setIsDrawerOpen(false)
      fetchData()
    } catch (error) {
      toast.error('Erro ao salvar transação.')
    }
  }

  async function performDelete() {
    if (!confirmDelete) return
    try {
      await apiService.delete('transactions', confirmDelete)
      toast.success('Transação removida com sucesso!')
      setConfirmDelete(null)
      fetchData()
    } catch (error) {
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
    } catch (error) {
      toast.error('Erro ao registrar pagamento.');
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-app-text tracking-tight">Transações</h1>
            <p className="text-app-text-dim mt-1">Histórico de movimentações financeiras.</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-app-text text-app-bg px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <DateFilter currentDate={selectedDate} onDateChange={setSelectedDate} />
            <div className="h-8 w-px bg-app-soft hidden sm:block"></div>
            <p className="text-xs font-bold text-app-text-dim uppercase tracking-wider">
              {transactions.length} Lançamentos
            </p>
          </div>
          
          <button 
            onClick={fetchData}
            className="p-2.5 text-app-text-dim hover:text-app-text hover:bg-app-soft rounded-xl transition-all"
            title="Atualizar dados"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-app-card border border-app rounded-3xl overflow-hidden transition-all duration-500 shadow-sm">
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
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                       <Search className="w-12 h-12 text-app-text-dim mx-auto mb-4" />
                       <p className="text-app-text-dim">Nenhuma transação encontrada.</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-app-soft/30 transition-colors group">
                      <td className="px-6 py-4 text-sm text-app-text-dim font-mono">
                        {new Intl.DateTimeFormat('pt-BR').format(new Date(tx.date))}
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
                              {tx.status === 'paid' ? 'Pago' : (new Date(tx.due_date) < new Date() ? 'Atrasado' : 'Pendente')}
                            </span>
                            <span className="text-[10px] text-app-text-dim font-bold">
                              Vence {new Intl.DateTimeFormat('pt-BR').format(new Date(tx.due_date))}
                            </span>
                            {tx.status === 'paid' && tx.payment_date && (
                              <span className="text-[10px] text-emerald-500 font-bold">
                                Pago em {new Intl.DateTimeFormat('pt-BR').format(new Date(tx.payment_date))}
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
                          {tx.status === 'pending' && (
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
      </div>

      {/* Transaction Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-app-card border border-app w-full max-w-lg rounded-3xl shadow-2xl p-8 my-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-app-text mb-6">
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text-dim">Descrição</label>
                <input required value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Aluguel, Mercado, Freelance..."
                  className="w-full bg-app-bg border border-app transition-all duration-300 rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-app-accent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-app-text-dim">Valor</label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    required 
                    value={amount} 
                    onChange={e => setAmount(e.target.value.replace(/[^0-9,.]/g, '').replace('.', ','))}
                    className="w-full bg-app-bg border border-app transition-all duration-300 rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-app-accent outline-none font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-app-text-dim">Data</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)}
                    className="w-full bg-app-bg border border-app transition-all duration-300 rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-app-accent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text-dim">Tipo</label>
                <div className="flex p-1 bg-app-soft rounded-xl gap-1 border border-app">
                  <button type="button" onClick={() => setType('Expense')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'Expense' ? 'bg-rose-600 text-white shadow-lg' : 'text-app-text-dim hover:text-app-text'}`}>
                    Despesa
                  </button>
                  <button type="button" onClick={() => setType('Income')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'Income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-app-text-dim hover:text-app-text'}`}>
                    Receita
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-app-text-dim">Conta</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-app-bg border border-app transition-all duration-300 rounded-xl px-4 py-2.5 text-app-text focus:ring-2 focus:ring-app-accent outline-none text-sm">
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-app-text-dim">Categoria</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="w-full bg-app-bg border border-app transition-all duration-300 rounded-xl px-4 py-2.5 text-app-text focus:ring-2 focus:ring-app-accent outline-none text-sm">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-app-soft/50 border border-app rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-app-text block">Despesa Fixa?</span>
                    <span className="text-[10px] text-app-text-dim">Marque para controle de vencimento mensal</span>
                  </div>
                  <input type="checkbox" checked={isFixed} onChange={e => setIsFixed(e.target.checked)}
                    className="w-5 h-5 accent-app-accent" />
                </div>

                {isFixed && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-app">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-app-text-dim uppercase">Vencimento</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                        className="w-full bg-app-bg border border-app rounded-lg px-3 py-2 text-xs text-app-text outline-none focus:ring-1 focus:ring-app-accent" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-app-text-dim uppercase">Status</label>
                      <select value={status} onChange={e => setStatus(e.target.value as any)}
                        className="w-full bg-app-bg border border-app rounded-lg px-3 py-2 text-xs text-app-text outline-none focus:ring-1 focus:ring-app-accent">
                        <option value="paid">Pago</option>
                        <option value="pending">Pendente</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {status === 'paid' && isFixed && (
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-app-text-dim uppercase">Data do Pagamento</label>
                      <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                        className="w-full bg-app-bg border border-app rounded-lg px-3 py-2 text-xs text-app-text outline-none focus:ring-1 focus:ring-app-accent" />
                   </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button type="button" onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 px-6 py-3 text-app-text-dim font-bold hover:text-app-text transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-app-text text-app-bg px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm">
                  {editingTransaction ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      <ConfirmDialog isOpen={isConfirmSaveOpen} 
        title={editingTransaction ? "Confirmar Edição" : "Confirmar Lançamento"}
        message={editingTransaction ? "Deseja salvar as alterações feitas nesta transação?" : "Deseja registrar este novo lançamento no sistema?"}
        confirmLabel="Confirmar" onConfirm={performSave}
        onClose={() => setIsConfirmSaveOpen(false)}
      />
    </DashboardLayout>
  )
}
