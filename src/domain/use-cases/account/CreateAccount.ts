import { IAccountRepository } from '../../interfaces/IAccountRepository';
import { CreateAccountDTO, Account } from '../../entities/Account';

export class CreateAccount {
    constructor(private repository: IAccountRepository) {}

    async execute(data: CreateAccountDTO): Promise<Account> {
        return await this.repository.create(data);
    }
}
