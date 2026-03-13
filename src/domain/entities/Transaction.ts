export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
    id: string;
    accountId: string;
    organizationId: string;
    categoryId: string;
    amount: number;
    description: string;
    date: Date;
    type: TransactionType;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTransactionDTO {
    accountId: string;
    organizationId: string;
    categoryId: string;
    amount: number;
    description: string;
    date: Date;
    type: TransactionType;
}

export interface UpdateTransactionDTO {
    amount?: number;
    description?: string;
    date?: Date;
    categoryId?: string;
}
