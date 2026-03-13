'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from './utils';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastProps {
    id: string;
    message: string;
    variant?: ToastVariant;
    onClose: (id: string) => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
    id, 
    message, 
    variant = 'success', 
    onClose, 
    duration = 5000 
}) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    };

    const icons = {
        success: <CheckCircle2 className="text-emerald-500" size={20} />,
        error: <XCircle className="text-rose-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
    };

    const variants = {
        success: "border-emerald-100 dark:border-emerald-900/30 bg-white dark:bg-zinc-950",
        error: "border-rose-100 dark:border-rose-900/30 bg-white dark:bg-zinc-950",
        info: "border-blue-100 dark:border-blue-900/30 bg-white dark:bg-zinc-950",
    };

    return (
        <div className={cn(
            "flex items-center gap-3 p-4 pr-12 rounded-2xl border shadow-lg min-w-[320px] max-w-md pointer-events-auto transition-all duration-300",
            variants[variant],
            isExiting ? "opacity-0 translate-x-10 scale-95" : "animate-in slide-in-from-right-10 fade-in"
        )}>
            <div className="flex-shrink-0">
                {icons[variant]}
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {message}
            </p>
            <button 
                onClick={handleClose}
                className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};
