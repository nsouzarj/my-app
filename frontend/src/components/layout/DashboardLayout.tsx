import Sidebar from "./Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-app text-app-text transition-colors duration-500">
      <Sidebar />
      <div className="lg:pl-72 min-h-screen flex flex-col">
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center border-b border-app bg-app/80 backdrop-blur-md px-8">
           <div className="flex-1" />
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
