export interface Category {
    id: string;
    organizationId: string;
    name: string;
    color?: string | null;
    icon?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCategoryDTO {
    organizationId: string;
    name: string;
    color?: string;
    icon?: string;
}

export interface UpdateCategoryDTO {
    name?: string;
    color?: string;
    icon?: string;
}
