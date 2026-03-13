import { ITransactionRepository } from '../../interfaces/ITransactionRepository';
import { Transaction } from '../../entities/Transaction';

export class ListTransactions {
    constructor(private repository: ITransactionRepository) {}

    async execute(organizationId: string): Promise<Transaction[]> {
        return this.repository.findByOrganizationId(organizationId);
    }
}
