export interface Account {
    id: string;
    organizationId: string;
    name: string;
    type: 'Checking' | 'Savings' | 'Credit Card';
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAccountDTO {
    organizationId: string;
    name: string;
    type: 'Checking' | 'Savings' | 'Credit Card';
    balance?: number;
}

export interface UpdateAccountDTO {
    name?: string;
    type?: 'Checking' | 'Savings' | 'Credit Card';
    balance?: number;
}
