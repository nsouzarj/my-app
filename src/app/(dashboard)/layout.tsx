'use client';

import { Sidebar } from "./Sidebar"
import { useAuth, ClerkLoaded, ClerkLoading } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { apiService } from "@/infrastructure/services/apiService"
import { useRouter } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { orgId, userId, isLoaded } = useAuth();
  const router = useRouter();
  const organizationId = userId || 'default_org';
  const [orgName, setOrgName] = useState("Finanças");

  useEffect(() => {
    if (isLoaded && !userId) {
        router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    const fetchOrg = async () => {
        try {
            const result = await apiService.get('config', organizationId);
            if (result.orgName) setOrgName(result.orgName);
        } catch (error) {
            console.error('Error fetching org settings:', error);
        }
    };
    fetchOrg();
  }, [organizationId]);

  if (!isLoaded || !userId) {
    return <div className="min-h-screen flex items-center justify-center">Carregando autenticação...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <Sidebar orgName={orgName} />

      {/* Main Content */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center gap-4 border-b-2 border-foreground/5 bg-background px-6 lg:px-8">
          <div className="flex-1" />
          <div className="flex items-center gap-4 bg-accent/5 p-1 rounded-sm border border-accent/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-accent px-2">System Active</span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 reveal">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
