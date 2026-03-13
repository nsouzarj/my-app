'use client';

import React from 'react';
import { cn } from './utils';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
    isLoading?: boolean;
    variant?: 'primary' | 'danger' | 'success';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
    onClose,
    isLoading = false,
    variant = 'primary'
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        primary: {
            icon: <AlertCircle className="w-6 h-6 text-zinc-500" />,
            button: "bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black hover:opacity-90",
            bg: "bg-zinc-50 dark:bg-zinc-900"
        },
        danger: {
            icon: <AlertCircle className="w-6 h-6 text-red-500" />,
            button: "bg-red-600 text-white hover:bg-red-700",
            bg: "bg-red-50 dark:bg-red-950/20"
        },
        success: {
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
            button: "bg-emerald-600 text-white hover:bg-emerald-700",
            bg: "bg-emerald-50 dark:bg-emerald-950/20"
        }
    };

    const currentVariant = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-white dark:bg-zinc-950 border border-border w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-2xl", currentVariant.bg)}>
                            {currentVariant.icon}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 line-clamp-1">
                                {title}
                            </h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-0 flex flex-col-reverse sm:flex-row items-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full sm:flex-1 px-6 py-3 text-zinc-500 dark:text-zinc-400 font-bold text-sm hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "w-full sm:flex-1 px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50",
                            currentVariant.button
                        )}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
