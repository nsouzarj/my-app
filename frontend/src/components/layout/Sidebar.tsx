import { LayoutDashboard, ReceiptText, Tags, Wallet, Settings, Menu, X, LogOut, BarChart3 } from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { cn } from "../../lib/utils"
import { useAuth } from "../../contexts/AuthContext"

const navigation = [
  { name: 'Painel', href: '/', icon: LayoutDashboard },
  { name: 'Transações', href: '/transactions', icon: ReceiptText },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Contas', href: '/accounts', icon: Wallet },
  { name: 'Categorias', href: '/categories', icon: Tags },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { organization, logout } = useAuth()
  const orgName = organization?.name || 'Finanças'

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-app bg-app/80 backdrop-blur-md px-6">
        <button 
          className="text-app-text-dim hover:text-app-text"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-bold text-app-text">{orgName}</span>
      </header>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-app-card border-r border-app transition-transform lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-10 px-2 text-app-text">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-app-text rounded-xl flex items-center justify-center shadow-lg shadow-black/10 ring-1 ring-white/10">
                  <span className="text-app-bg font-black text-xl">{orgName.charAt(0)}</span>
              </div>
              <span className="text-xl font-bold tracking-tight truncate">{orgName}</span>
            </div>
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6 text-app-text-dim" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium group text-sm",
                    isActive 
                      ? "bg-app text-app-text" 
                      : "text-app-text-dim hover:text-app-text hover:bg-app/50"
                  )}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-app-text" : "text-app-text-dim group-hover:text-app-text"
                  )} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="pt-6 border-t border-app px-2 mt-auto">
             <button 
               onClick={logout}
               className="flex items-center gap-3 w-full px-3 py-2.5 text-app-text-dim hover:text-red-400 transition-colors text-sm font-medium"
             >
                <LogOut className="w-5 h-5" />
                Sair
             </button>
          </div>
        </div>
      </aside>
    </>
  )
}
