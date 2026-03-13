export interface User {
    id: string;
    email: string;
    fullName?: string | null;
    phone?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: { id: string; email: string; fullName?: string }): Promise<User>;
    update(id: string, data: { fullName?: string }): Promise<User>;
}
