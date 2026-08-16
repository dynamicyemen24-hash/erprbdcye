import React from 'react';
import { designTokens } from '../../lib/designTokens';

interface WorkspaceShellProps {
  children: React.ReactNode;
  header: React.ReactNode;
}

export function WorkspaceShell({ children, header }: WorkspaceShellProps) {
  return (
    <div className={`min-h-screen ${designTokens.colors.bgBase} flex flex-col gap-4`}>
      <header className={`sticky top-0 z-50 ${designTokens.colors.bgCard} border-b ${designTokens.colors.border} p-4`}>
        {header}
      </header>
      <main className="flex-1 p-6 md:p-8 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
      <footer className="p-4 text-center text-xs text-zinc-500">
        NexoraOS™ Enterprise Platform - {new Date().getFullYear()}
      </footer>
    </div>
  );
}
