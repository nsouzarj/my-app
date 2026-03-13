import { ICategoryRepository } from '../../interfaces/ICategoryRepository';
import { CreateCategoryDTO, Category } from '../../entities/Category';

export class CreateCategory {
    constructor(private repository: ICategoryRepository) {}

    async execute(data: CreateCategoryDTO): Promise<Category> {
        return await this.repository.create(data);
    }
}
