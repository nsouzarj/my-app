import { IAccountRepository } from '../../interfaces/IAccountRepository';

export class DeleteAccount {
    constructor(private repository: IAccountRepository) {}

    async execute(id: string, organizationId: string): Promise<void> {
        await this.repository.delete(id, organizationId);
    }
}
