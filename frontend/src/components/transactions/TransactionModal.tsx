import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { X, AlertCircle } from 'lucide-react';
import { toast } from '../ui/Toast';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DateInput } from '../ui/DateInput';
import { cn } from '../../lib/utils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: any | null;
}

export function TransactionModal({ isOpen, onClose, onSuccess, transaction }: TransactionModalProps) {
  const { organization } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDeps, setIsFetchingDeps] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('0,00');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDependencies();
      if (transaction) {
        populateForm(transaction);
      } else {
        resetForm();
      }
    }
  }, [isOpen, transaction]);

  async function fetchDependencies() {
    if (!organization) return;
    try {
      setIsFetchingDeps(true);
      const [a, c] = await Promise.all([
        apiService.get('accounts', { organizationId: organization.organizationId }),
        apiService.get('categories', { organizationId: organization.organizationId })
      ]);
      setAccounts(a);
      setCategories(c);
      
      if (!transaction) {
        if (a.length > 0) setAccountId(a[0].id);
        if (c.length > 0) setCategoryId(c[0].id);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados auxiliares.');
    } finally {
      setIsFetchingDeps(false);
    }
  }

  function populateForm(tx: any) {
    setDescription(tx.description);
    setAmount(tx.amount.toFixed(2).replace('.', ','));
    setDate(new Date(tx.date).toISOString().split('T')[0]);
    const normalizedType = tx.type.charAt(0).toUpperCase() + tx.type.slice(1).toLowerCase() as 'Income' | 'Expense';
    setType(normalizedType);
    setAccountId(tx.accountId);
    setCategoryId(tx.categoryId);
    setDueDate(tx.due_date ? new Date(tx.due_date).toISOString().split('T')[0] : '');
    setPaymentDate(tx.payment_date ? new Date(tx.payment_date).toISOString().split('T')[0] : '');
    setStatus(tx.status || 'paid');
    setIsFixed(tx.is_fixed === 1 || tx.is_fixed === true);
  }

  function resetForm() {
    setDescription('');
    setAmount('0,00');
    setDate(new Date().toISOString().split('T')[0]);
    setType('Expense');
    setDueDate('');
    setPaymentDate('');
    setStatus('paid');
    setIsFixed(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organization) return;

    try {
      setIsLoading(true);
      const cleanAmount = amount.replace(/\./g, '').replace(',', '.');
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
      };

      if (transaction?.id) {
        await apiService.put('transactions', transaction.id, payload);
        toast.success('Transação atualizada!');
      } else {
        await apiService.post('transactions', payload);
        toast.success('Lançamento realizado!');
      }
      
      onSuccess();
      onClose();
    } catch (_error) {
      toast.error('Erro ao salvar transação.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className={cn(
        "relative w-full max-w-lg bg-app-card border-x border-t sm:border border-app shadow-2xl transition-all duration-300 transform",
        "rounded-t-[32px] sm:rounded-[32px]", // Bottom sheet on mobile, rounded on desktop
        "animate-in slide-in-from-bottom sm:zoom-in-95",
        "max-h-[92vh] flex flex-col"
      )}>
        
        {/* Mobile Handle */}
        <div className="sm:hidden flex justify-center py-3">
          <div className="w-12 h-1.5 bg-app-soft rounded-full opacity-50"></div>
        </div>

        <div className="px-6 pb-6 sm:p-8 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-app-text tracking-tight">
                {transaction ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
              <p className="text-xs text-app-text-dim font-bold uppercase tracking-widest mt-1">
                {type === 'Income' ? '💰 Entrada de Valor' : '💸 Saída de Valor'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-app-soft rounded-full text-app-text-dim transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {isFetchingDeps ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-app-text-dim animate-pulse">Carregando contas e categorias...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Switch - Modern Segmented Control */}
              <div className="p-1.5 bg-app-soft/50 border border-app rounded-2xl flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setType('Expense')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2",
                    type === 'Expense' 
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-[1.02]" 
                      : "text-app-text-dim hover:text-app-text"
                  )}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setType('Income')}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2",
                    type === 'Income' 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]" 
                      : "text-app-text-dim hover:text-app-text"
                  )}
                >
                  Receita
                </button>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-app-text-dim uppercase tracking-widest ml-1">O que é isso?</label>
                <input
                  autoFocus
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Aluguel, Supermercado, Salário..."
                  className="w-full bg-app border-2 border-transparent focus:border-app-accent/30 bg-app-soft/30 rounded-2xl px-5 py-4 text-app-text text-lg font-bold outline-none placeholder:text-app-text-dim/30 transition-all"
                />
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-app-text-dim uppercase tracking-widest ml-1">Quanto?</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-app-text-dim font-bold">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value.replace(/[^0-9,.]/g, '').replace('.', ','))}
                      className="w-full bg-app-soft/30 border-2 border-transparent focus:border-app-accent/30 rounded-2xl pl-12 pr-5 py-4 text-app-text text-xl font-black outline-none transition-all tabular-nums"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <DateInput
                    label="Quando?"
                    value={date}
                    onChange={setDate}
                    className="py-4 border-2 border-transparent bg-app-soft/30 hover:border-app-accent/30"
                  />
                </div>
              </div>

              {/* Account & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-app-text-dim uppercase tracking-widest ml-1">Qual Conta?</label>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-app-soft/30 border-2 border-transparent focus:border-app-accent/30 rounded-2xl px-5 py-4 text-app-text font-bold outline-none appearance-none cursor-pointer transition-all"
                  >
                    {accounts.map(a => <option key={a.id} value={a.id} className="bg-app-card">{a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-app-text-dim uppercase tracking-widest ml-1">Qual Categoria?</label>
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full bg-app-soft/30 border-2 border-transparent focus:border-app-accent/30 rounded-2xl px-5 py-4 text-app-text font-bold outline-none appearance-none cursor-pointer transition-all"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-app-card">{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Controls Section (Fixed/Pending) */}
              <div className="bg-app border border-app rounded-[24px] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl transition-colors",
                      isFixed ? "bg-app-accent/20 text-app-accent" : "bg-app-soft text-app-text-dim"
                    )}>
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <span className="text-sm font-black text-app-text block">Lançamento Fixo?</span>
                      <span className="text-[10px] text-app-text-dim uppercase tracking-wider font-bold">Repetir mensalmente</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isFixed} onChange={e => setIsFixed(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-app-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-accent"></div>
                  </label>
                </div>

                {isFixed && (
                  <div className="pt-4 border-t border-app grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <DateInput
                        label="Vencimento"
                        value={dueDate}
                        onChange={setDueDate}
                        className="py-2.5 bg-app text-xs border border-app rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-app-text-dim uppercase tracking-widest ml-1">Status</label>
                        <select
                          value={status}
                          onChange={(e) => { setStatus(e.target.value as any); }}
                          className="w-full bg-app border border-app rounded-xl px-4 py-2.5 text-xs text-app-text font-bold outline-none cursor-pointer"
                        >
                          <option value="paid">Pago</option>
                          <option value="pending">Pendente</option>
                        </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 pb-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-4 text-app-text-dim font-black uppercase tracking-wider text-xs hover:text-app-text transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full sm:flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-[0.98]",
                    type === 'Income' ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" : "bg-app-text text-app-bg hover:opacity-90 shadow-app-text/10",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? 'Salvando...' : (transaction ? 'Salvar Alterações' : 'Confirmar Lançamento')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
