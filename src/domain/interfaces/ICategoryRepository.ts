import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../entities/Category';

export interface ICategoryRepository {
    findByOrganizationId(organizationId: string): Promise<Category[]>;
    findById(id: string, organizationId: string): Promise<Category | null>;
    create(data: CreateCategoryDTO): Promise<Category>;
    update(id: string, organizationId: string, data: UpdateCategoryDTO): Promise<Category>;
    delete(id: string, organizationId: string): Promise<void>;
}
