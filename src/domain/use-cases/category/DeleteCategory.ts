import { ICategoryRepository } from '../../interfaces/ICategoryRepository';

export class DeleteCategory {
    constructor(private repository: ICategoryRepository) {}

    async execute(id: string, organizationId: string): Promise<void> {
        await this.repository.delete(id, organizationId);
    }
}
