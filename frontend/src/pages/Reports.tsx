import { useState, useEffect } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { FileText, Download, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts'
import { toast } from '../components/ui/Toast'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export default function Reports() {
  const { organization } = useAuth()
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    if (organization) fetchReportData()
  }, [organization, period])

  async function fetchReportData() {
    try {
      setIsLoading(true)
      // Usaremos o mesmo dashboard data por enquanto, mas futuramente uma rota reports.php
      const data = await apiService.get('dashboard', { organizationId: organization.organizationId, period })
      setReportData(data)
    } catch (error) {
      toast.error('Erro ao carregar relatórios.')
    } finally {
      setIsLoading(false)
    }
  }

  const exportPDF = () => toast.success('Relatório pronto para exportação! (Simulação)')

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-app-text tracking-tight">Relatórios Detalhados</h1>
            <p className="text-app-text-dim mt-1">Visão analítica da sua saúde financeira.</p>
          </div>
          <div className="flex gap-3">
             <select 
               value={period} 
               onChange={e => setPeriod(e.target.value)}
               className="bg-app-card border border-app rounded-xl px-4 py-2 text-sm text-app-text font-bold outline-none"
             >
               <option value="month">Este Mês</option>
               <option value="year">Este Ano</option>
             </select>
             <button 
               onClick={exportPDF}
               className="flex items-center gap-2 bg-app-text text-app-bg px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg text-sm"
             >
               <Download size={16} />
               Exportar PDF
             </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-40 bg-app-card/30 rounded-3xl border border-app">
            <LoadingSpinner size="lg" label="Gerando relatórios analíticos..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gastos por Categoria */}
            <div className="bg-app-card border border-app rounded-2xl p-8">
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
            <div className="bg-app-card border border-app rounded-2xl p-8">
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
                      {reportData?.accounts?.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--color-app-accent)' : '#a8a29e'} />
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
          <div className="p-6 border-b border-app flex items-center gap-2">
             <FileText size={18} className="text-app-accent" />
             <h3 className="text-lg font-bold text-app-text">Resumo Mensal</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-app-bg border-b border-app">
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
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                         <span className="text-sm font-bold text-app-text">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm font-black text-right text-app-text">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.value)}
                    </td>
                    <td className="px-6 py-3 text-sm text-right text-app-text-dim font-mono">
                       {((cat.value / reportData.monthlyExpenses) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
