import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { FileText, Download, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts'
import { toast } from '../components/ui/Toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { cn } from '../lib/utils'
import { DateFilter } from '../components/ui/DateFilter'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export default function Reports() {
  const { organization } = useAuth()
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  useEffect(() => {
    if (organization) fetchReportData()
  }, [organization, selectedDate])

  async function fetchReportData() {
    try {
      setIsLoading(true)
      const startDate = selectedDate ? format(startOfMonth(selectedDate), 'yyyy-MM-dd') : '2000-01-01';
      const endDate = selectedDate ? format(endOfMonth(selectedDate), 'yyyy-MM-dd') : '2100-12-31';
      // Usaremos o mesmo dashboard data por enquanto, mas futuramente uma rota reports.php
      const data = await apiService.get('dashboard', { organizationId: organization.organizationId, startDate, endDate })
      setReportData(data)
    } catch (error) {
      toast.error('Erro ao carregar relatórios.')
    } finally {
      setIsLoading(false)
    }
  }

  const exportPDF = () => {
    window.print()
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Print Only Header */}
        <div className="print-only mb-10 border-b-2 border-app-text pb-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Relatório Financeiro</h1>
              <p className="text-sm font-bold text-gray-500 mt-1">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-black">{organization?.name}</p>
              <p className="text-xs text-gray-400">ID: {organization?.organizationId}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-3xl font-bold text-app-text tracking-tight">Relatórios Detalhados</h1>
            <p className="text-app-text-dim mt-1">Visão analítica da sua saúde financeira.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
             <div className="w-full sm:w-auto">
               <DateFilter currentDate={selectedDate} onDateChange={setSelectedDate} />
             </div>
             <button 
               onClick={exportPDF}
               className="flex items-center gap-2 bg-app-text text-app-bg px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm group"
             >
               <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
               Exportar PDF
             </button>
          </div>
        </div>

        {/* Financial Summary Cards (Printable) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-emerald-600 border border-emerald-500 rounded-3xl p-6 shadow-lg transition-all hover:scale-[1.02]">
            <span className="text-xs font-black text-white/80 uppercase tracking-widest">Receitas Total</span>
            <p className="text-3xl font-black text-white mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reportData?.income || 0)}
            </p>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">Status: Confirmado</span>
          </div>
          <div className="bg-rose-600 border border-rose-500 rounded-3xl p-6 shadow-lg transition-all hover:scale-[1.02]">
            <span className="text-xs font-black text-white/80 uppercase tracking-widest">Despesas Total</span>
            <p className="text-3xl font-black text-white mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(reportData?.expenses || 0)}
            </p>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">Status: Confirmado</span>
          </div>
          <div className={cn(
            "border rounded-3xl p-6 shadow-lg transition-all hover:scale-[1.02]",
            (reportData?.income - reportData?.expenses) >= 0 
              ? "bg-sky-600 border-sky-500" 
              : "bg-amber-600 border-amber-500"
          )}>
            <span className="text-xs font-black text-white/80 uppercase tracking-widest">Resultado Líquido</span>
            <p className="text-3xl font-black text-white mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', signDisplay: 'always' }).format(reportData?.income - reportData?.expenses)}
            </p>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">
              Status: {(reportData?.income - reportData?.expenses) >= 0 ? 'Positivo' : 'Negativo'}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-40 bg-app-card/30 rounded-3xl border border-app">
            <LoadingSpinner size="lg" label="Gerando relatórios analíticos..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gastos por Categoria */}
            <div className="bg-app-card border border-app rounded-2xl p-8 no-print">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <PieChartIcon size={20} className="text-app-accent" />
                  <h3 className="text-xl font-bold text-app-text">Distribuição de Gastos</h3>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData?.categoryBreakdown || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData?.categoryBreakdown?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-app-card)', border: '1px solid var(--color-app-border)', borderRadius: '12px' }}
                      formatter={(v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparativo de Saldo por Conta */}
            <div className="bg-app-card border border-app rounded-2xl p-8 no-print">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <BarChart3 size={20} className="text-app-accent" />
                  <h3 className="text-xl font-bold text-app-text">Saldos por Conta</h3>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData?.accounts || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-app-border)" opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--color-app-text-dim)', fontSize: 11}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--color-app-text-dim)', fontSize: 11}} />
                    <Tooltip 
                       cursor={{fill: 'var(--color-app-bg)', opacity: 0.1}}
                       contentStyle={{ backgroundColor: 'var(--color-app-card)', border: '1px solid var(--color-app-border)', borderRadius: '12px' }}
                       formatter={(v: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))}
                    />
                    <Bar dataKey="balance" radius={[6, 6, 0, 0]}>
                      {reportData?.accounts?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Summary Table */}
        <div className="bg-app-card border border-app rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-app flex items-center gap-2 no-print">
             <FileText size={18} className="text-app-accent" />
             <h3 className="text-lg font-bold text-app-text">Distribuição por Categoria</h3>
          </div>
          <div className="p-6 border-b border-app hidden print:block">
             <h3 className="text-lg font-bold text-black uppercase">Detalhamento de Categorias</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-app-bg/50 border-b border-app print:bg-gray-50">
                  <th className="px-6 py-4 text-xs font-bold text-app-text-dim uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-4 text-xs font-bold text-app-text-dim uppercase tracking-wider text-right">Valor Total</th>
                  <th className="px-6 py-4 text-xs font-bold text-app-text-dim uppercase tracking-wider text-right">% do Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app">
                {reportData?.categoryBreakdown?.map((cat: any) => (
                  <tr key={cat.name} className="hover:bg-app-soft/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full no-print" style={{ backgroundColor: cat.color }}></div>
                         <span className="text-sm font-bold text-app-text print:text-black">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm font-black text-right text-app-text print:text-black">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.value)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-app-text-dim font-mono print:text-gray-600">
                       {reportData.expenses > 0 ? ((cat.value / reportData.expenses) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Only Footer */}
        <div className="print-only mt-20 pt-10 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            Documento gerado pelo Sistema de Gestão Financeira Premium - {organization?.name}
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
