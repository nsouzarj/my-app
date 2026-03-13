import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DateFilterProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function DateFilter({ currentDate, onDateChange }: DateFilterProps) {
  const handlePrevMonth = () => onDateChange(subMonths(currentDate, 1))
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1))

  return (
    <div className="flex items-center gap-3 bg-app-card border border-app p-1.5 rounded-xl">
      <button 
        onClick={handlePrevMonth}
        className="p-1.5 hover:bg-app-soft rounded-lg transition-colors text-app-text-dim hover:text-app-text"
        title="Mês Anterior"
      >
        <ChevronLeft size={18} />
      </button>
      
      <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
        <Calendar size={16} className="text-app-primary opacity-70" />
        <span className="text-sm font-bold text-app-text capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </span>
      </div>

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
