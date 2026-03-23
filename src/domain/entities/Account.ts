export interface Account {
    id: string;
    organizationId: string;
    name: string;
    type: 'Checking' | 'Savings' | 'Credit Card' | 'Investment';
    balance: number;
    creditLimit?: number | null;
    closingDay?: number | null;
    dueDay?: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAccountDTO {
    organizationId: string;
    name: string;
    type: 'Checking' | 'Savings' | 'Credit Card' | 'Investment';
    balance?: number;
    creditLimit?: number | null;
    closingDay?: number | null;
    dueDay?: number | null;
}

export interface UpdateAccountDTO {
    name?: string;
    type?: 'Checking' | 'Savings' | 'Credit Card' | 'Investment';
    balance?: number;
    creditLimit?: number | null;
    closingDay?: number | null;
    dueDay?: number | null;
}
