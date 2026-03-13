'use client';
import { TransactionsClient } from './TransactionsClient';

export default function TransactionsPage() {
    return (
        <TransactionsClient
            initialTransactions={[]}
            categories={[]}
            accounts={[]}
        />
    );
}
