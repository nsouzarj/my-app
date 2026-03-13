'use client';

import Link from "next/link";
import { ArrowRight, Wallet, ReceiptText, Tags, ShieldCheck } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [userId, isLoaded, router]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-950 dark:bg-zinc-50 rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black font-bold">F</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Finanças</span>
        </div>
        <div className="flex items-center gap-4">
            <Link 
                href="/sign-in" 
                className="px-6 py-2.5 text-sm font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-2xl transition-all"
            >
                Entrar
            </Link>
            <Link 
                href="/sign-up" 
                className="px-6 py-2.5 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black rounded-2xl text-sm font-bold transition-all hover:opacity-90 shadow-lg"
            >
                Criar Conta
            </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-3xl space-y-8">
            <h1 className="text-6xl font-extrabold tracking-tighter text-zinc-950 dark:text-zinc-50 sm:text-7xl">
                Controle suas finanças com <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-500 to-zinc-950 dark:from-zinc-400 dark:to-zinc-50">precisão absoluta.</span>
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                A plataforma moderna para gestão financeira pessoal e empresarial. 
                Multi-tenant, segura e desenhada para quem busca clareza nos números.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/sign-up" className="w-full sm:w-auto px-8 py-4 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black rounded-2xl text-lg font-semibold flex items-center justify-center gap-2 group transition-all hover:scale-[1.02]">
                    Criar conta gratuita
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 rounded-2xl text-lg font-semibold transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    Ver Dashboard
                </Link>
            </div>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto w-full">
            {[
                { icon: Wallet, title: "Multi-Contas", desc: "Gerencie bancos, cartões e investimentos em um só lugar." },
                { icon: ReceiptText, title: "Transações", desc: "Controle granular de receitas e despesas com categorias." },
                { icon: Tags, title: "Organização", desc: "Filtros e tags inteligentes para sua empresa ou uso pessoal." },
                { icon: ShieldCheck, title: "Segurança", desc: "Isolamento de dados e autenticação robusta nativa." }
            ].map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-left space-y-4 hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                        <feature.icon className="w-6 h-6 text-zinc-950 dark:text-zinc-50" />
                    </div>
                    <h3 className="font-bold text-zinc-950 dark:text-zinc-50">{feature.title}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
                </div>
            ))}
        </div>
      </main>

      <footer className="py-12 px-8 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-7xl mx-auto w-full mt-24">
         <span className="text-zinc-400 text-sm">© 2026 Finanças SaaS. Todos os direitos reservados.</span>
         <div className="flex items-center gap-8">
             <Link href="#" className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 text-sm">Privacidade</Link>
             <Link href="#" className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 text-sm">Termos</Link>
         </div>
      </footer>
    </div>
  );
}
