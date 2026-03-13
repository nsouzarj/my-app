import { Account, CreateAccountDTO, UpdateAccountDTO } from '../entities/Account';

export interface IAccountRepository {
    findByOrganizationId(organizationId: string): Promise<Account[]>;
    findById(id: string, organizationId: string): Promise<Account | null>;
    create(data: CreateAccountDTO): Promise<Account>;
    update(id: string, organizationId: string, data: UpdateAccountDTO): Promise<Account>;
    delete(id: string, organizationId: string): Promise<void>;
    updateBalance(id: string, organizationId: string, amount: number): Promise<void>;
}
