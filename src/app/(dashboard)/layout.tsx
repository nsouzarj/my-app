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
        <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 lg:px-8">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
              {/* Optional header actions */}
          </div>
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
