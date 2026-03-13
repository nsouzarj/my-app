import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from '../components/ui/Toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

interface Category {
  id: string
  name: string
  type: 'Income' | 'Expense'
  color: string
}

export default function Categories() {
  const { organization } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [type, setType] = useState<'Income' | 'Expense'>('Expense')
  const [color, setColor] = useState('#3b82f6')
  const [isSaving, setIsSaving] = useState(false)

  // Confirm state
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false)

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#4b5563', '#1e293b', '#fbbf24'
  ]

  useEffect(() => {
    fetchCategories()
  }, [organization])

  const fetchCategories = async () => {
    if (!organization) return
    try {
      setIsLoading(true)
      const data = await apiService.get('categories', { organizationId: organization.organizationId })
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setName(category.name)
      setType(category.type as any)
      setColor(category.color)
    } else {
      setEditingCategory(null)
      setName('')
      setType('Expense')
      setColor('#3b82f6')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsConfirmSaveOpen(true)
  }

  const performSave = async () => {
    setIsConfirmSaveOpen(false)
    try {
      setIsSaving(true)
      const data = {
        name,
        type,
        color,
        organizationId: organization?.organizationId
      }

      if (editingCategory) {
        await apiService.put('categories', editingCategory.id, data)
        toast.success('Categoria atualizada!')
      } else {
        await apiService.post('categories', data)
        toast.success('Categoria criada!')
      }

      setIsModalOpen(false)
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Erro ao salvar categoria')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    setConfirmDelete(id)
  }

  const performDelete = async () => {
    if (!confirmDelete) return
    try {
      await apiService.delete('categories', confirmDelete)
      toast.success('Categoria excluída')
      setConfirmDelete(null)
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Erro ao excluir categoria')
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" label="Carregando categorias..." />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-app-text tracking-tight">Categorias</h1>
            <p className="text-app-text-dim mt-1">Gerencie suas categorias de receita e despesa.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-app-text text-app-bg px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus size={18} /> Nova Categoria
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-app-card border border-app p-6 rounded-2xl shadow-sm hover:border-app-accent/30 transition-all duration-300 group">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div 
                    className="p-2 rounded-lg transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${category.color}15`, color: category.color || (category.type.toLowerCase() === 'income' ? '#10b981' : '#f43f5e') }}
                  >
                    {category.type.toLowerCase() === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-app-text">{category.name}</h3>
                    <span className={`text-[10px] font-bold uppercase ${category.type.toLowerCase() === 'income' ? 'text-app-income' : 'text-app-expense'}`}>
                      {category.type.toLowerCase() === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(category)} className="p-2 text-app-text-dim hover:text-app-text transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(category.id)} className="p-2 text-rose-500 hover:text-rose-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-app-card border border-app w-full max-w-md rounded-3xl shadow-2xl p-8 my-8 animate-in zoom-in-95 duration-200">
              <h2 className="text-2xl font-bold text-app-text mb-6">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-app-text-dim">Nome da Categoria</label>
                  <input required value={name} onChange={e => setName(e.target.value)}
                    placeholder="Ex: Alimentação, Salário, Lazer..."
                    className="w-full bg-app-bg border border-app transition-all duration-300 rounded-xl px-4 py-3 text-app-text focus:ring-2 focus:ring-app-accent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-app-text-dim">Tipo</label>
                  <div className="flex p-1 bg-app-soft rounded-xl gap-1 border border-app">
                    <button type="button" 
                      onClick={() => setType('Expense')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'Expense' ? 'bg-rose-600 text-white shadow-lg' : 'text-app-text-dim hover:text-app-text'}`}>
                      Despesa
                    </button>
                    <button type="button" 
                      onClick={() => setType('Income')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'Income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-app-text-dim hover:text-app-text'}`}>
                      Receita
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-app-text-dim">Cor da Categoria</label>
                  <div className="grid grid-cols-5 gap-3">
                    {colors.map(c => (
                      <button key={c} type="button" onClick={() => setColor(c)}
                        className={`w-full h-10 rounded-xl border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 text-app-text-dim font-bold hover:text-app-text transition-colors">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 bg-app-text text-app-bg px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm">
                    {editingCategory ? 'Salvar' : 'Criar Categoria'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmação de Exclusão */}
        <ConfirmDialog 
          isOpen={!!confirmDelete}
          title="Excluir Categoria"
          message="Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita e pode afetar transações existentes."
          confirmLabel="Excluir"
          variant="danger"
          onConfirm={performDelete}
          onClose={() => setConfirmDelete(null)}
        />

        {/* Confirmação de Salvamento */}
        <ConfirmDialog 
          isOpen={isConfirmSaveOpen}
          title={editingCategory ? "Atualizar Categoria" : "Criar Categoria"}
          message={editingCategory ? "Deseja salvar as alterações nesta categoria?" : "Confirma a criação desta nova categoria?"}
          confirmLabel="Confirmar"
          isLoading={isSaving}
          onConfirm={performSave}
          onClose={() => setIsConfirmSaveOpen(false)}
        />
      </div>
    </DashboardLayout>
  )
}
