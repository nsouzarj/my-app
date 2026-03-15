import { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface DateInputProps {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export function DateInput({ value, onChange, label, required, className }: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (inputRef.current) {
      try {
        // Tenta abrir o seletor nativo de forma programática
        // @ts-ignore - showPicker é um método moderno nem sempre no @types
        if (inputRef.current.showPicker) {
          inputRef.current.showPicker();
        } else {
          inputRef.current.focus();
          inputRef.current.click();
        }
      } catch (e) {
        inputRef.current.focus();
        inputRef.current.click();
      }
    }
  };

  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="text-sm font-medium text-app-text-dim block ml-1">
          {label}
        </label>
      )}
      <div 
        onClick={handleClick}
        className={cn(
          "relative group cursor-pointer w-full bg-app-bg border border-app hover:border-app-accent/50 transition-all duration-300 rounded-xl px-4 py-3 flex items-center justify-between",
          className
        )}
      >
        <span className={cn(
          "text-app-text font-medium",
          !value && "text-app-text-dim/50"
        )}>
          {value ? formatDate(value) : "DD/MM/AAAA"}
        </span>
        
        <Calendar className="w-4 h-4 text-app-text-dim group-hover:text-app-accent transition-colors" />

        {/* Hidden native input that handles the actual date selection */}
        <input
          ref={inputRef}
          type="date"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
