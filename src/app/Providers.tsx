'use client';

import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { ThemeProvider } from "@/infrastructure/ui/ThemeProvider";
import { ToastProvider } from "@/infrastructure/ui/ToastProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider localization={ptBR}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        themes={['light', 'dark', 'system', 'cyber-pool']}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
