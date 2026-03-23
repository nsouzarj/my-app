import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DateFilterProps {
  currentDate: Date | null
  onDateChange: (date: Date | null) => void
}

export function DateFilter({ currentDate, onDateChange }: DateFilterProps) {
  const handlePrevMonth = () => {
    if (currentDate) onDateChange(subMonths(currentDate, 1))
    else onDateChange(subMonths(new Date(), 1))
  }
  
  const handleNextMonth = () => {
    if (currentDate) onDateChange(addMonths(currentDate, 1))
    else onDateChange(addMonths(new Date(), 1))
  }

  const toggleAllTime = () => {
    if (currentDate) onDateChange(null)
    else onDateChange(new Date())
  }

  return (
    <div className="flex items-center gap-3 bg-app-card border border-app p-1.5 rounded-xl">
      <button 
        onClick={handlePrevMonth}
        className="p-1.5 hover:bg-app-soft rounded-lg transition-colors text-app-text-dim hover:text-app-text"
        title="Mês Anterior"
      >
        <ChevronLeft size={18} />
      </button>
      
      <button 
        onClick={toggleAllTime}
        className="flex items-center gap-2 px-2 min-w-[140px] justify-center hover:bg-app-soft rounded-lg transition-colors py-1 cursor-pointer"
        title="Clique para alternar (Todos os Meses / Mensal)"
      >
        <Calendar size={16} className="text-app-primary opacity-70" />
        <span className="text-sm font-bold text-app-text capitalize">
          {currentDate ? format(currentDate, 'MMMM yyyy', { locale: ptBR }) : 'Todos os Meses'}
        </span>
      </button>

      <button 
        onClick={handleNextMonth}
        className="p-1.5 hover:bg-app-soft rounded-lg transition-colors text-app-text-dim hover:text-app-text"
        title="Próximo Mês"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
