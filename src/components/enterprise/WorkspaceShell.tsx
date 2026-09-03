import React from 'react';
import { designTokens } from '../../lib/designTokens';

interface WorkspaceShellProps {
  children: React.ReactNode;
  header: React.ReactNode;
}

export function WorkspaceShell({ children, header }: Readonly<WorkspaceShellProps>) {
  return (
    <div className={`min-h-screen overflow-x-hidden ${designTokens.colors.bgBase} flex flex-col`}>
      <header className={`sticky top-0 z-50 ${designTokens.colors.bgCard} border-b ${designTokens.colors.border} px-4 py-3 md:p-4`}>
        {header}
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
      <footer className="px-4 py-3 text-center text-[11px] text-zinc-500">
        NexoraOS™ Enterprise Platform - {new Date().getFullYear()}
      </footer>
    </div>
  );
}
