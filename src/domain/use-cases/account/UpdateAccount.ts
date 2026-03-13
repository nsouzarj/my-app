import { IAccountRepository } from '../../interfaces/IAccountRepository';
import { UpdateAccountDTO, Account } from '../../entities/Account';

export class UpdateAccount {
    constructor(private repository: IAccountRepository) {}

    async execute(id: string, organizationId: string, data: UpdateAccountDTO): Promise<Account> {
        return await this.repository.update(id, organizationId, data);
    }
}
