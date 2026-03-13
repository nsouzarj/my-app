import { ITransactionRepository } from '../../domain/interfaces/ITransactionRepository';
import { CreateTransactionDTO, Transaction } from '../../domain/entities/Transaction';

/**
 * Use Case: Create a Transaction
 * Independent of DB, Frameworks, or UI.
 */
export class CreateTransactionUseCase {
    constructor(private readonly transactionRepository: ITransactionRepository) { }

    async execute(organizationId: string, data: Omit<CreateTransactionDTO, 'organizationId'>): Promise<Transaction> {

        // Business Logic Validation Example
        if (data.amount <= 0 && data.type === 'Income') {
            throw new Error("Income amount must be greater than zero");
        }

        // Pass down to the infrastructure layer via domain interface
        return this.transactionRepository.create({
            ...data,
            organizationId,
        });
    }
}
