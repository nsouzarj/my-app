import { ITransactionRepository } from '../../domain/interfaces/ITransactionRepository';
import { Transaction, CreateTransactionDTO, UpdateTransactionDTO, TransactionType } from '../../domain/entities/Transaction';
import prisma from './prisma';

export class PrismaTransactionRepository implements ITransactionRepository {

    async findByOrganizationId(organizationId: string): Promise<Transaction[]> {
        const transactions = await prisma.transaction.findMany({
            where: { organizationId },
            include: { 
                category: true,
                account: true
            },
            orderBy: { date: 'desc' }
        });

        // Mapping Prisma returning objects to Domain Objects 
        return transactions.map(t => ({
            ...t,
            amount: Number(t.amount),
            type: t.type as Transaction['type']
        }));
    }

    async findById(id: string, organizationId: string): Promise<Transaction | null> {
        const transaction = await prisma.transaction.findFirst({
            where: { id, organizationId }
        });

        if (!transaction) return null;

        return {
            ...transaction,
            amount: Number(transaction.amount),
            type: transaction.type as Transaction['type']
        };
    }

    async create(data: CreateTransactionDTO): Promise<Transaction> {
        const transaction = await prisma.transaction.create({
            data: {
                ...data,
                amount: data.amount, // Prisma Decimal accepts numbers
            }
        });

        return {
            ...transaction,
            amount: Number(transaction.amount),
            type: transaction.type as Transaction['type']
        };
    }

    async update(id: string, organizationId: string, data: UpdateTransactionDTO): Promise<Transaction> {
        // Ensure user belongs to the organization and record exists
        const existing = await prisma.transaction.findFirst({
            where: { id, organizationId }
        });

        if (!existing) {
            throw new Error('Transaction not found or access denied');
        }

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                ...data,
                amount: data.amount !== undefined ? data.amount : undefined,
                categoryId: data.categoryId,
            }
        });

        return {
            ...transaction,
            amount: Number(transaction.amount),
            type: transaction.type as TransactionType
        };
    }

    async delete(id: string, organizationId: string): Promise<void> {
        // Ensure tenant isolation on delete
        const result = await prisma.transaction.deleteMany({
            where: { id, organizationId }
        });

        if (result.count === 0) {
            throw new Error('Transaction not found or access denied');
        }
    }
}
