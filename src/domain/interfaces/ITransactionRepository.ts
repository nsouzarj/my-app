import { Transaction, CreateTransactionDTO, UpdateTransactionDTO } from '../entities/Transaction';

export interface ITransactionRepository {
    /**
     * Finds all transactions for a specific organization (Multi-tenant requirement)
     */
    findByOrganizationId(organizationId: string): Promise<Transaction[]>;

    /**
     * Finds a specific transaction by ID, ensuring it belongs to the organization
     */
    findById(id: string, organizationId: string): Promise<Transaction | null>;

    /**
     * Creates a new transaction
     */
    create(data: CreateTransactionDTO): Promise<Transaction>;

    /**
     * Updates an existing transaction
     */
    update(id: string, organizationId: string, data: UpdateTransactionDTO): Promise<Transaction>;

    /**
     * Deletes a transaction
     */
    delete(id: string, organizationId: string): Promise<void>;
}
