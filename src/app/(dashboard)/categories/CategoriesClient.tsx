'use client';

import React, { useState } from 'react';
import { Category } from '@/domain/entities/Category';
import { CategoryTable } from './CategoryTable';
import { CategoryForm } from './CategoryForm';
import { Plus } from 'lucide-react';
import { ConfirmDialog } from '@/infrastructure/ui/ConfirmDialog';
import { useToast } from '@/infrastructure/ui/ToastProvider';
import { apiService } from '@/infrastructure/services/apiService';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

interface CategoriesClientProps {
    initialCategories: Category[];
}

export const CategoriesClient: React.FC<CategoriesClientProps> = ({ initialCategories }) => {
    const { userId } = useAuth();
    const organizationId = userId || 'default_org';
    const toast = useToast();
    const [categories, setCategories] = useState(initialCategories);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        refreshData();
    }, [organizationId]);

    const refreshData = async () => {
        try {
            const data = await apiService.get('categories', organizationId);
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Confirmation Dialog State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: 'primary' | 'danger' | 'success';
        onConfirm: () => void;
        confirmLabel?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'primary',
        onConfirm: () => {},
    });

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setIsDrawerOpen(true);
    };

    const handleOpenEdit = (category: Category) => {
        setEditingCategory(category);
        setIsDrawerOpen(true);
    };

    const handleClose = () => {
        setIsDrawerOpen(false);
        setEditingCategory(null);
    };

    const handleSubmit = (data: any) => {
        setConfirmState({
            isOpen: true,
            title: editingCategory ? 'Confirmar Alteração' : 'Confirmar Criação',
            message: editingCategory 
                ? 'Deseja salvar as alterações nesta categoria?' 
                : 'Deseja confirmar a criação desta nova categoria?',
            variant: 'primary',
            confirmLabel: editingCategory ? 'Salvar' : 'Criar',
            onConfirm: () => performSubmit(data)
        });
    };

    const performSubmit = async (data: any) => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        setIsLoading(true);
        try {
            if (editingCategory) {
                await apiService.put('categories', editingCategory.id, data);
            } else {
                await apiService.post('categories', { ...data, organizationId });
            }

            toast.success(editingCategory ? 'Categoria atualizada!' : 'Categoria criada com sucesso!');
            handleClose();
            refreshData();
        } catch (error) {
            console.error('Error submitting category:', error);
            toast.error('Erro inesperado ao salvar categoria.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Excluir Categoria',
            message: 'Tem certeza que deseja excluir esta categoria? Isso pode afetar as transações vinculadas.',
            variant: 'danger',
            confirmLabel: 'Excluir Permanentemente',
            onConfirm: () => performDelete(id)
        });
    };

    const performDelete = async (id: string) => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
            await apiService.delete('categories', id);
            toast.success('Categoria excluída com sucesso!');
            refreshData();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Não foi possível excluir a categoria.');
        }
    };

    return (
        <div className="relative min-h-[calc(100vh-80px)] p-6 md:p-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Categorias</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Organize suas transações por tipos personalizados.</p>
                </div>
                <button 
                    onClick={handleOpenCreate}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-zinc-200 dark:shadow-none"
                >
                    <Plus size={20} />
                    Nova Categoria
                </button>
            </div>

            <CategoryTable 
                categories={categories} 
                onEdit={handleOpenEdit} 
                onDelete={handleDelete} 
            />

            {/* Confirmation Dialog */}
            <ConfirmDialog 
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                confirmLabel={confirmState.confirmLabel}
                onConfirm={confirmState.onConfirm}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                isLoading={isLoading}
            />

            {/* Drawer Backdrop */}
            {isDrawerOpen && (
                <div 
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end transition-all animate-in fade-in duration-300"
                    onClick={handleClose}
                >
                    <div 
                        className="animate-in slide-in-from-right duration-300 h-full w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CategoryForm 
                            initialData={editingCategory || {}}
                            onSubmit={handleSubmit}
                            onClose={handleClose}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
