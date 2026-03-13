import { ICategoryRepository } from '../../interfaces/ICategoryRepository';
import { UpdateCategoryDTO, Category } from '../../entities/Category';

export class UpdateCategory {
    constructor(private repository: ICategoryRepository) {}

    async execute(id: string, organizationId: string, data: UpdateCategoryDTO): Promise<Category> {
        return await this.repository.update(id, organizationId, data);
    }
}
