import { ITransactionRepository } from '../../interfaces/ITransactionRepository';
import { IAccountRepository } from '../../interfaces/IAccountRepository';
import { Transaction, UpdateTransactionDTO } from '../../entities/Transaction';

export class UpdateTransaction {
    constructor(
        private repository: ITransactionRepository,
        private accountRepository: IAccountRepository
    ) {}

    async execute(id: string, organizationId: string, data: UpdateTransactionDTO): Promise<Transaction> {
        const existing = await this.repository.findById(id, organizationId);
        if (!existing) {
            throw new Error('Transaction not found');
        }

        const updated = await this.repository.update(id, organizationId, data);

        // Handle balance update
        // If amount changed:
        if (data.amount !== undefined && data.amount !== existing.amount) {
            const oldImpact = existing.type === 'Income' ? existing.amount : -existing.amount;
            const newImpact = existing.type === 'Income' ? data.amount : -data.amount;
            const diff = newImpact - oldImpact;
            
            await this.accountRepository.updateBalance(existing.accountId, organizationId, diff);
        }

        return updated;
    }
}
