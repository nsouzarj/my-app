import { ICategoryRepository } from '../../interfaces/ICategoryRepository';
import { Category } from '../../entities/Category';

export class ListCategories {
    constructor(private repository: ICategoryRepository) {}

    async execute(organizationId: string): Promise<Category[]> {
        return this.repository.findByOrganizationId(organizationId);
    }
}
