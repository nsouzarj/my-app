import React, { type InputHTMLAttributes, forwardRef, useEffect, useRef } from 'react';
import { maskCurrency } from '../../lib/currencyUtils';
import { cn } from '../../lib/utils';

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, icon, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const combinedRef = (ref as React.MutableRefObject<HTMLInputElement | null>) || internalRef;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const maskedValue = maskCurrency(e.target.value);
      onChange(maskedValue);
    };

    // Mantém o cursor no final do input ao digitar
    useEffect(() => {
      if (combinedRef.current) {
        const len = combinedRef.current.value.length;
        combinedRef.current.setSelectionRange(len, len);
      }
    }, [value]);

    return (
      <div className="relative w-full group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-dim/50 group-focus-within:text-app-accent transition-colors z-10">
            {icon}
          </div>
        )}
        <input
          ref={combinedRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          className={cn(
            "w-full bg-app-soft/30 border-2 border-transparent focus:border-app-accent/30 rounded-2xl px-5 py-4 text-app-text text-xl font-bold outline-none transition-all tabular-nums",
            icon && "pl-12",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
