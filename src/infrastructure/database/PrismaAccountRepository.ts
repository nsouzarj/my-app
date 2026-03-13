import { IAccountRepository } from '../../domain/interfaces/IAccountRepository';
import { Account, CreateAccountDTO, UpdateAccountDTO } from '../../domain/entities/Account';
import prisma from './prisma';

export class PrismaAccountRepository implements IAccountRepository {

    async findByOrganizationId(organizationId: string): Promise<Account[]> {
        const accounts = await prisma.account.findMany({
            where: { organizationId },
            orderBy: { name: 'asc' }
        });

        return accounts.map(a => ({
            ...a,
            balance: Number(a.balance),
            type: a.type as Account['type']
        }));
    }

    async findById(id: string, organizationId: string): Promise<Account | null> {
        const account = await prisma.account.findFirst({
            where: { id, organizationId }
        });

        if (!account) return null;

        return {
            ...account,
            balance: Number(account.balance),
            type: account.type as Account['type']
        };
    }

    async create(data: CreateAccountDTO): Promise<Account> {
        const account = await prisma.account.create({
            data: {
                ...data,
                balance: data.balance ?? 0,
            }
        });

        return {
            ...account,
            balance: Number(account.balance),
            type: account.type as Account['type']
        };
    }

    async update(id: string, organizationId: string, data: UpdateAccountDTO): Promise<Account> {
        const account = await this.findById(id, organizationId);
        if (!account) {
            throw new Error('Account not found or access denied');
        }

        const updated = await prisma.account.update({
            where: { id },
            data: {
                ...data,
            }
        });

        return {
            ...updated,
            balance: Number(updated.balance),
            type: updated.type as Account['type']
        };
    }

    async delete(id: string, organizationId: string): Promise<void> {
        await prisma.account.deleteMany({
            where: { id, organizationId }
        });
    }

    async updateBalance(id: string, organizationId: string, amount: number): Promise<void> {
        await prisma.account.update({
            where: { id, organizationId },
            data: {
                balance: {
                    increment: amount
                }
            }
        });
    }
}
