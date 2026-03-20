import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    let d: Date;
    if (typeof date === 'string') {
      // Trata yyyy-MM-dd especificamente para evitar o shift do UTC
      if (date.includes('-') && date.length === 10) {
        const [year, month, day] = date.split('-').map(Number);
        d = new Date(year, month - 1, day);
      } else {
        d = new Date(date);
      }
    } else {
      d = date;
    }
    return format(d, 'dd/MM/yyyy');
  } catch (error) {
    return '-';
  }
}

