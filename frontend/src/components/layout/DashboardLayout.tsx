import { useAuth } from "../../contexts/AuthContext"
import { User, ShieldCheck } from "lucide-react"
import Sidebar from "./Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-app text-app-text transition-colors duration-500">
      <Sidebar />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center border-b border-app bg-app/80 backdrop-blur-md px-8 justify-between">
           <div className="flex-1" />
           {user && (
             <div className="flex items-center gap-3">
               <div className="text-right">
                 <p className="text-sm font-bold text-app-text leading-tight">{user.fullName || 'Usuário'}</p>
                 <p className="text-[10px] text-app-text-dim font-medium">{user.email}</p>
               </div>
               <div className="relative">
                 <div className="w-10 h-10 rounded-full bg-app-soft border border-app flex items-center justify-center text-app-text-dim">
                   <User size={20} />
                 </div>
                 <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 p-0.5 rounded-full border-2 border-app-bg">
                   <ShieldCheck size={10} className="text-white" />
                 </div>
               </div>
             </div>
           )}
        </header>

        <main className="flex-1 p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
