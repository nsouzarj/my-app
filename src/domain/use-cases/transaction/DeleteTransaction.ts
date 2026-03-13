import { ITransactionRepository } from '../../interfaces/ITransactionRepository';
import { IAccountRepository } from '../../interfaces/IAccountRepository';

export class DeleteTransaction {
    constructor(
        private repository: ITransactionRepository,
        private accountRepository: IAccountRepository
    ) {}

    async execute(id: string, organizationId: string): Promise<void> {
        const transaction = await this.repository.findById(id, organizationId);
        
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // Revert account balance
        const amount = transaction.type === 'Income' ? -transaction.amount : transaction.amount;
        await this.accountRepository.updateBalance(transaction.accountId, organizationId, amount);

        return this.repository.delete(id, organizationId);
    }
}
