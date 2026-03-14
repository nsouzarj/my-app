import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Pencil, Trash2, Wallet, Landmark, CreditCard, PiggyBank, DollarSign, Calendar, FileText, ArrowUp, ArrowDown } from 'lucide-react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { toast } from '../components/ui/Toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { DateFilter } from '../components/ui/DateFilter'

interface Account {
  id: string
  name: string
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CASH'
  balance: number
}

interface Category {
  id: string
  name: string
  type: string
}

const accountTypes = [
  { value: 'CHECKING', label: 'Conta Corrente', icon: Landmark },
  { value: 'SAVINGS', label: 'Poupança', icon: PiggyBank },
  { value: 'INVESTMENT', label: 'Investimento', icon: Wallet },
  { value: 'CASH', label: 'Dinheiro', icon: CreditCard },
]

export default function Accounts() {
  const { organization } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  
  // Account Form State
  const [name, setName] = useState('')
  const [type, setType] = useState('CHECKING')
  const [balance, setBalance] = useState('0')

  // Income Entry State
  const [isIncomeDrawerOpen, setIsIncomeDrawerOpen] = useState(false)
  const [targetAccount, setTargetAccount] = useState<Account | null>(null)
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeDescription, setIncomeDescription] = useState('Recebimento de Salário')
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0])
  const [incomeCategoryId, setIncomeCategoryId] = useState('')

  // Account Statement State
  const [isStatementOpen, setIsStatementOpen] = useState(false)
  const [statementTransactions, setStatementTransactions] = useState<any[]>([])
  const [isStatementLoading, setIsStatementLoading] = useState(false)
  const [statementDate, setStatementDate] = useState(new Date())
  const [statementSortBy, setStatementSortBy] = useState('date')
  const [statementSortOrder, setStatementSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  // Confirm State
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false)

  useEffect(() => {
    if (organization) {
      fetchAccounts()
      fetchCategories()
    }
  }, [organization])

  useEffect(() => {
    if (isStatementOpen && targetAccount) {
      fetchStatement(targetAccount.id)
    }
  }, [statementDate, statementSortBy, statementSortOrder, isStatementOpen, targetAccount?.id])

  async function fetchAccounts() {
    try {
      setIsLoading(true)
      const data = await apiService.get('accounts', { organizationId: organization.organizationId })
      setAccounts(data)
    } catch (error) {
      toast.error('Erro ao carregar contas.')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      const data = await apiService.get('categories', { organizationId: organization.organizationId })
      // Filtrar apenas categorias de receita (income)
      const incomeCats = data.filter((c: any) => c.type.toLowerCase() === 'income')
      setCategories(incomeCats)
      if (incomeCats.length > 0) setIncomeCategoryId(incomeCats[0].id)
    } catch (error) {
      console.error('Erro ao carregar categorias')
    }
  }

  function handleOpenCreate() {
    setEditingAccount(null)
    setName('')
    setType('CHECKING')
    setBalance('0,00')
    setIsDrawerOpen(true)
  }

  function handleOpenEdit(account: Account) {
    setEditingAccount(account)
    setName(account.name)
    setType(account.type)
    setBalance(account.balance.toFixed(2).replace('.', ','))
    setIsDrawerOpen(true)
  }

  function handleOpenIncome(account: Account) {
    setTargetAccount(account)
    setIncomeAmount('')
    setIsIncomeDrawerOpen(true)
  }

  async function fetchStatement(accountId: string) {
    try {
      setIsStatementLoading(true)
      const data = await apiService.get('transactions', { 
        organizationId: organization.organizationId,
        accountId: accountId,
        startDate: format(startOfMonth(statementDate), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(statementDate), 'yyyy-MM-dd'),
        sortBy: statementSortBy,
        order: statementSortOrder
      })
      setStatementTransactions(data)
    } catch (error) {
      toast.error('Erro ao carregar extrato.')
    } finally {
      setIsStatementLoading(false)
    }
  }

  function toggleStatementSort(field: string) {
    if (statementSortBy === field) {
      setStatementSortOrder(statementSortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setStatementSortBy(field)
      setStatementSortOrder('ASC')
    }
  }

  function handleOpenStatement(account: Account) {
    setTargetAccount(account)
    setStatementTransactions([])
    setStatementDate(new Date())
    setStatementSortBy('date')
    setStatementSortOrder('DESC')
    setIsStatementOpen(true)
  }

  async function handleIncomeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!targetAccount || !incomeAmount) return

    // Normalizar valor: Remove pontos de milhar, troca vírgula por ponto
    const cleanAmount = incomeAmount.replace(/\./g, '').replace(',', '.')
    const normalizedAmount = parseFloat(cleanAmount)

    if (isNaN(normalizedAmount)) {
      toast.error('Valor inválido. Por favor, use o formato 1234,56')
      return
    }

    try {
      await apiService.post('transactions', {
        amount: normalizedAmount,
        description: incomeDescription,
        date: incomeDate,
        type: 'income',
        accountId: targetAccount.id,
        categoryId: incomeCategoryId,
        organizationId: organization.organizationId,
        status: 'paid'
      })
      
      toast.success(`Receita de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(normalizedAmount)} lançada!`)
      setIsIncomeDrawerOpen(false)
      fetchAccounts()
    } catch (error) {
      toast.error('Erro ao lançar receita.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsConfirmSaveOpen(true)
  }

  async function performSave() {
    setIsConfirmSaveOpen(false)
    try {
      const cleanBalance = balance.replace(/\./g, '').replace(',', '.')
      const payload = {
        name,
        type,
        balance: parseFloat(cleanBalance),
        organizationId: organization.organizationId
      }

      if (editingAccount) {
        await apiService.put('accounts', editingAccount.id, payload)
        toast.success('Conta atualizada!')
      } else {
        await apiService.post('accounts', payload)
        toast.success('Conta criada!')
      }
      
      setIsDrawerOpen(false)
      fetchAccounts()
    } catch (error) {
      toast.error('Erro ao salvar conta.')
    }
  }

  async function performDelete() {
    if (!confirmDelete) return
    try {
      await apiService.delete('accounts', confirmDelete)
      toast.success('Conta removida!')
      setConfirmDelete(null)
      fetchAccounts()
    } catch (error) {
      toast.error('Erro ao excluir conta.')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-app-text tracking-tight">Contas</h1>
            <p className="text-app-text-dim mt-1">Gerencie seu "Balancão": Lançamentos de entrada e saldos reais.</p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-app-text text-app-bg px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-app-card/30 rounded-3xl border border-app">
            <LoadingSpinner size="lg" label="Carregando suas contas..." />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-20 bg-app-card/30 rounded-3xl border border-dashed border-app">
            <Wallet className="w-12 h-12 text-app-text-dim mx-auto mb-4" />
            <h3 className="text-lg font-medium text-app-text-dim">Nenhuma conta cadastrada</h3>
            <p className="text-app-text-dim text-sm mt-1">Clique em "Nova Conta" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map(account => {
              const TypeIcon = accountTypes.find(t => t.value === account.type)?.icon || Landmark
              return (
                <div key={account.id} className="group bg-app-card border border-app p-6 rounded-3xl hover:border-app-accent/30 transition-all duration-300 shadow-sm hover:shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-app-soft rounded-2xl text-app-accent">
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenEdit(account)}
                        className="p-2 text-app-text-dim hover:text-app-text transition-colors bg-app-bg/50 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(account.id)}
                        className="p-2 text-app-text-dim hover:text-red-400 transition-colors bg-app-bg/50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-app-text mb-1">{account.name}</h3>
                    <p className="text-2xl font-black text-app-text mb-4">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)}
                    </p>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleOpenStatement(account)}
                        className="flex-1 flex items-center justify-center gap-2 bg-app-card border border-app text-app-text-dim py-2.5 rounded-xl font-bold hover:bg-app-soft hover:text-app-text transition-all text-xs shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ver Extrato
                      </button>
                      
                      <button 
                        onClick={() => handleOpenIncome(account)}
                        className="flex-1 flex items-center justify-center gap-2 bg-app-accent/10 border border-app-accent/20 text-app-accent py-2.5 rounded-xl font-bold hover:bg-app-accent hover:text-app-bg transition-all text-xs shadow-sm"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Lançar Receita
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Account Statement Drawer */}
      {isStatementOpen && targetAccount && (
        <div className="fixed inset-0 z-[60] flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="bg-app-card border-l border-app h-full w-full max-w-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-app-soft rounded-2xl text-app-accent">
                     <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-app-text">Extrato: {targetAccount.name}</h2>
                    <p className="text-sm text-app-text-dim">Histórico de movimentações recentes</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <DateFilter currentDate={statementDate} onDateChange={setStatementDate} />
                  <button 
                    onClick={() => setIsStatementOpen(false)}
                    className="p-2 hover:bg-app-soft rounded-xl text-app-text-dim transition-colors"
                  >
                     <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>
              </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {isStatementLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <LoadingSpinner size="lg" />
                  <p className="text-app-text-dim animate-pulse">Buscando lançamentos...</p>
                </div>
              ) : statementTransactions.length === 0 ? (
                <div className="text-center py-20 bg-app-soft/20 rounded-3xl border border-dashed border-app m-4">
                  <FileText className="w-12 h-12 text-app-text-dim mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium text-app-text-dim">Sem movimentação</h3>
                  <p className="text-app-text-dim text-sm mt-1">Nenhuma transação encontrada para esta conta.</p>
                </div>
              ) : (
                <div className="bg-app-card border border-app rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-app-soft/50 border-b border-app">
                        <th 
                          className="px-4 py-3 text-[10px] font-bold text-app-text-dim uppercase cursor-pointer hover:text-app-text"
                          onClick={() => toggleStatementSort('date')}
                        >
                          <div className="flex items-center gap-1">
                            Data {statementSortBy === 'date' && (statementSortOrder === 'ASC' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-[10px] font-bold text-app-text-dim uppercase cursor-pointer hover:text-app-text"
                          onClick={() => toggleStatementSort('description')}
                        >
                          <div className="flex items-center gap-1">
                            Descrição {statementSortBy === 'description' && (statementSortOrder === 'ASC' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-[10px] font-bold text-app-text-dim uppercase text-right cursor-pointer hover:text-app-text"
                          onClick={() => toggleStatementSort('amount')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Valor {statementSortBy === 'amount' && (statementSortOrder === 'ASC' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-[10px] font-bold text-app-text-dim uppercase text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app">
                      {(() => {
                        // Calcular saldo acumulado de trás para frente (do mais antigo para o mais novo)
                        // Para exibir do mais novo para o mais antigo, precisamos calcular o histórico.
                        let currentBalance = targetAccount.balance;
                        const rowsWithBalance = [...statementTransactions].map((tx) => {
                          const balanceAtThisPoint = currentBalance;
                          // Ao subir na lista (voltando no tempo), revertemos a transação
                          if (tx.type.toLowerCase() === 'income') {
                            currentBalance -= tx.amount;
                          } else {
                            currentBalance += tx.amount;
                          }
                          return { ...tx, runningBalance: balanceAtThisPoint };
                        });

                        return rowsWithBalance.map(tx => (
                          <tr key={tx.id} className="hover:bg-app-soft/30 transition-colors group">
                            <td className="px-4 py-4 text-[11px] text-app-text-dim font-mono">
                               {new Intl.DateTimeFormat('pt-BR').format(new Date(tx.date))}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-app-text">{tx.description}</span>
                                <span className="text-[9px] text-app-text-dim uppercase tracking-wider">{tx.categoryName || 'Geral'}</span>
                              </div>
                            </td>
                            <td className={`px-4 py-4 text-xs font-black text-right whitespace-nowrap ${tx.type.toLowerCase() === 'income' ? 'text-app-income' : 'text-app-expense'}`}>
                               {new Intl.NumberFormat('pt-BR', { 
                                 style: 'currency', 
                                 currency: 'BRL',
                                 signDisplay: 'always'
                               }).format(tx.type.toLowerCase() === 'income' ? tx.amount : -tx.amount)}
                            </td>
                            <td className="px-4 py-4 text-[10px] text-app-text font-bold text-right font-mono">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.runningBalance)}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-app bg-app-bg/30 flex items-center justify-between">
               <div className="text-app-text-dim text-xs font-bold uppercase tracking-widest">
                  Saldo nesta conta
               </div>
               <div className="text-2xl font-black text-app-text">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(targetAccount.balance)}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Income Modal */}
      {isIncomeDrawerOpen && targetAccount && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-app-card border border-app w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-app-text">
                Lançar Receita: {targetAccount.name}
              </h2>
            </div>

            <form onSubmit={handleIncomeSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text-dim">Quanto você recebeu?</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-dim font-bold">R$</span>
                  <input 
                    type="text"
                    inputMode="decimal"
                    required
                    autoFocus
                    value={incomeAmount}
                    onChange={e => setIncomeAmount(e.target.value.replace(/[^0-9,.]/g, '').replace('.', ','))}
                    placeholder="2.500,00"
                    className="w-full bg-app-bg border border-app rounded-xl pl-12 pr-4 py-4 text-app-text text-2xl font-black focus:ring-2 focus:ring-app-accent outline-none shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text-dim">Data de Recebimento</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-dim w-4 h-4" />
                  <input 
                    type="date"
                    required
                    value={incomeDate}
                    onChange={e => setIncomeDate(e.target.value)}
                    className="w-full bg-app-bg border border-app rounded-xl pl-12 pr-4 py-3 text-app-text focus:ring-2 focus:ring-app-accent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text-dim">Identificação</label>
                <input 
                  value={incomeDescription}
                  onChange={e => setIncomeDescription(e.target.value)}
                  placeholder="Ex: Salário Mensal, Bônus, Venda..."
                  className="w-full bg-app-bg border border-app rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-app-accent outline-none font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text-dim">Categoria</label>
                <select 
                  value={incomeCategoryId}
                  onChange={e => setIncomeCategoryId(e.target.value)}
                  className="w-full bg-app-bg border border-app rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-app-accent outline-none appearance-none"
                >
                  {categories.length > 0 ? (
                    categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  ) : (
                    <option value="">Lançamento Geral</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsIncomeDrawerOpen(false)}
                  className="flex-1 px-6 py-4 text-app-text-dim font-bold hover:text-app-text transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-green-500 text-white px-6 py-4 rounded-2xl font-black hover:bg-green-600 transition-all shadow-lg hover:shadow-green-500/20"
                >
                  Confirmar Salário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Drawer/Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-app-card border border-app w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-app-text mb-6">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text-dim">Nome da Conta</label>
                <input 
                  autoFocus
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Itaú, Nubank, Carteira..."
                  className="w-full bg-app-bg border border-app transition-all duration-300 rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-app-accent outline-none font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text-dim">Tipo de Conta</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full bg-app-bg border border-app transition-all duration-300 rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-app-accent outline-none font-mono"
                >
                  {accountTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-app-text-dim">Saldo Inicial (Manual)</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  required
                  value={balance}
                  onChange={e => setBalance(e.target.value.replace(/[^0-9,.]/g, '').replace('.', ','))}
                  className="w-full bg-app-bg border border-app rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-app-accent outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 px-6 py-3 text-app-text-dim font-bold hover:text-app-text transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-app-text text-app-bg px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shrink-0"
                >
                  {editingAccount ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={!!confirmDelete}
        title="Excluir Conta"
        message="Tem certeza que deseja excluir esta conta? Esta ação removerá o saldo, mas não afetará as transações já registradas."
        confirmLabel="Sim, excluir"
        variant="danger"
        onConfirm={performDelete}
        onClose={() => setConfirmDelete(null)}
      />

      <ConfirmDialog 
        isOpen={isConfirmSaveOpen}
        title={editingAccount ? "Confirmar Alteração" : "Confirmar Nova Conta"}
        message={editingAccount ? `Deseja atualizar os dados da conta "${editingAccount.name}"?` : "Deseja criar esta nova conta no sistema?"}
        confirmLabel="Confirmar"
        onConfirm={performSave}
        onClose={() => setIsConfirmSaveOpen(false)}
      />
    </DashboardLayout>
  )
}
