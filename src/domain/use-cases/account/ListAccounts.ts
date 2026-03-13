import { IAccountRepository } from '../../interfaces/IAccountRepository';
import { Account } from '../../entities/Account';

export class ListAccounts {
    constructor(private repository: IAccountRepository) {}

    async execute(organizationId: string): Promise<Account[]> {
        return this.repository.findByOrganizationId(organizationId);
    }
}
