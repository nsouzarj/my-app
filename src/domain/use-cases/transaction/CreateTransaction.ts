import { ITransactionRepository } from '../../interfaces/ITransactionRepository';
import { IAccountRepository } from '../../interfaces/IAccountRepository';
import { Transaction, CreateTransactionDTO } from '../../entities/Transaction';

export class CreateTransaction {
    constructor(
        private repository: ITransactionRepository,
        private accountRepository: IAccountRepository
    ) {}

    async execute(data: CreateTransactionDTO): Promise<Transaction> {
        const transaction = await this.repository.create(data);
        
        // Update account balance
        const amount = data.type === 'Income' ? data.amount : -data.amount;
        await this.accountRepository.updateBalance(data.accountId, data.organizationId, amount);
        
        return transaction;
    }
}
