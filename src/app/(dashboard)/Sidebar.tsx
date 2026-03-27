"use client"

import { UserButton } from "@clerk/nextjs"
import { LayoutDashboard, ReceiptText, Tags, Wallet, Settings, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/infrastructure/ui/utils"

const navigation = [
  { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Transações', href: '/transactions', icon: ReceiptText },
  { name: 'Contas', href: '/accounts', icon: Wallet },
  { name: 'Categorias', href: '/categories', icon: Tags },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

interface SidebarProps {
    orgName: string;
}

export function Sidebar({ orgName }: SidebarProps) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Trigger */}
      <header className="lg:hidden sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-6 lg:px-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
        <button 
          className="text-foreground/70 hover:text-foreground"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-black uppercase tracking-tighter text-foreground">{orgName}</span>
      </header>

      {/* Sidebar Desktop/Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border transition-transform lg:translate-x-0 transition-colors duration-300",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-10 h-10 bg-accent rounded-sm flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]">
                <span className="text-white font-black text-xl">{orgName.charAt(0)}</span>
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-foreground truncate">{orgName}</span>
          </div>

          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-sm transition-all font-bold uppercase tracking-wide text-xs border-2",
                    isActive 
                      ? "bg-accent border-accent text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" 
                      : "text-foreground/60 border-transparent hover:border-accent hover:text-foreground hover:bg-accent/10"
                  )}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-white" : "text-foreground/40 group-hover:text-foreground"
                  )} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 px-2 mt-auto">
            <div className="flex items-center justify-between w-full group/user cursor-pointer">
                <div className="flex items-center gap-3">
                    <UserButton 
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "w-10 h-10"
                        }
                      }}
                    />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Atalho da Conta</span>
                        <span className="text-xs text-zinc-500">Clique para Sair</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
