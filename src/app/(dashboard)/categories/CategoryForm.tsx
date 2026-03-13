'use client';

import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface CategoryFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
    onClose: () => void;
    isLoading?: boolean;
}

const PRESET_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
    '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'
];

export const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, onSubmit, onClose, isLoading }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [color, setColor] = useState(initialData?.color || PRESET_COLORS[0]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setColor(initialData.color || PRESET_COLORS[0]);
        }
    }, [initialData]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, color });
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {initialData?.id ? 'Editar Categoria' : 'Nova Categoria'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Name */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nome da Categoria</label>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Alimentação, Lazer..."
                        required
                        className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all text-lg"
                    />
                </div>

                {/* Color Picker */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Cor da Categoria</label>
                    <div className="grid grid-cols-6 gap-3">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={`w-full aspect-square rounded-full border-2 transition-all ${color === c ? 'border-zinc-900 dark:border-zinc-50 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
            </form>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <button 
                    onClick={handleFormSubmit}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                >
                    <Save size={20} />
                    {isLoading ? 'Salvando...' : 'Salvar Categoria'}
                </button>
            </div>
        </div>
    );
};
