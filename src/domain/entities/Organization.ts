export interface Organization {
    id: string;
    name: string;
    type: 'Personal' | 'Business';
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrganizationMember {
    organizationId: string;
    userId: string;
    role: 'Admin' | 'Member';
}

export interface IOrganizationRepository {
    findById(id: string): Promise<Organization | null>;
    findByUserId(userId: string): Promise<Organization[]>;
    create(data: { name: string; type: 'Personal' | 'Business'; createdBy: string }): Promise<Organization>;
    addMember(organizationId: string, userId: string, role: 'Admin' | 'Member'): Promise<void>;
}
