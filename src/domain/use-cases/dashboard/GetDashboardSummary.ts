import { ITransactionRepository } from '../../interfaces/ITransactionRepository';
import { IAccountRepository } from '../../interfaces/IAccountRepository';
import { Transaction } from '../../entities/Transaction';
import { Account } from '../../entities/Account';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface DashboardSummary {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    incomeChange: string;
    expenseChange: string;
    balanceChange: string;
    accounts: Account[];
    recentTransactions: (Transaction & { accountName: string })[];
    categoryBreakdown: {
        name: string;
        value: number;
        color: string;
    }[];
}

export class GetDashboardSummary {
    constructor(
        private transactionRepository: ITransactionRepository,
        private accountRepository: IAccountRepository
    ) {}

    async execute(organizationId: string): Promise<DashboardSummary> {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        // Fetch all data in parallel
        const [accounts, transactions] = await Promise.all([
            this.accountRepository.findByOrganizationId(organizationId),
            this.transactionRepository.findByOrganizationId(organizationId)
        ]);

        const currentMonthTransactions = transactions.filter(t => 
            t.date >= start && t.date <= end
        );

        const monthlyIncome = transactions
            .filter(t => t.type === 'Income' && t.date >= start && t.date <= end)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const monthlyExpenses = transactions
            .filter(t => t.type === 'Expense' && t.date >= start && t.date <= end)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // Calculate total balance from current account balances
        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

        // Map account names to recent transactions
        const recentTransactions = transactions
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5)
            .map(t => ({
                ...t,
                accountName: accounts.find(acc => acc.id === t.accountId)?.name || 'Conta desconhecida'
            }));

        // Simple mock for changes (could be calculated comparing to previous month)
        const incomeChange = "+0%";
        const expenseChange = "+0%";
        const balanceChange = "+0%";

        // Calculate category breakdown for current month (expenses only)
        const categoriesMap = new Map<string, { name: string, value: number }>();
        
        currentMonthTransactions.filter(t => t.type === 'Expense').forEach(t => {
            const categoryName = (t as any).category?.name || 'Sem Categoria';
            const current = categoriesMap.get(categoryName) || { name: categoryName, value: 0 };
            categoriesMap.set(categoryName, { ...current, value: current.value + Number(t.amount) });
        });

        const colors = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
        const categoryBreakdown = Array.from(categoriesMap.values())
            .sort((a, b) => b.value - a.value)
            .map((cat, index) => ({
                ...cat,
                color: colors[index % colors.length]
            }));

        return {
            totalBalance,
            monthlyIncome,
            monthlyExpenses,
            incomeChange,
            expenseChange,
            balanceChange,
            accounts,
            recentTransactions,
            categoryBreakdown
        };
    }
}
