import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { OperationMode } from '@/types/pos';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mode, setMode] = useState<OperationMode>('pizzeria');

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header mode={mode} onModeChange={setMode} />
        <main className="flex-1 overflow-auto p-3 lg:p-4 xl:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
