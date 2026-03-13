'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-zinc-950 dark:text-zinc-50">404</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Página não encontrada</p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-all"
        >
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
