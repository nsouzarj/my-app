import { ICategoryRepository } from '../../domain/interfaces/ICategoryRepository';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../../domain/entities/Category';
import prisma from './prisma';

export class PrismaCategoryRepository implements ICategoryRepository {

    async findByOrganizationId(organizationId: string): Promise<Category[]> {
        const categories = await prisma.category.findMany({
            where: { organizationId },
            orderBy: { name: 'asc' }
        });

        return categories;
    }

    async findById(id: string, organizationId: string): Promise<Category | null> {
        const category = await prisma.category.findFirst({
            where: { id, organizationId }
        });

        return category;
    }

    async create(data: CreateCategoryDTO): Promise<Category> {
        const category = await prisma.category.create({
            data
        });

        return category;
    }

    async update(id: string, organizationId: string, data: UpdateCategoryDTO): Promise<Category> {
        const category = await this.findById(id, organizationId);
        if (!category) {
            throw new Error('Category not found or access denied');
        }

        return await prisma.category.update({
            where: { id },
            data
        });
    }

    async delete(id: string, organizationId: string): Promise<void> {
        await prisma.category.deleteMany({
            where: { id, organizationId }
        });
    }
}
