import { AppSidebar } from '@/components/app-sidebar';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NuqsAdapter>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 bg-background p-4 pt-16 md:p-8 md:pt-8">
          {children}
        </main>
      </div>
    </NuqsAdapter>
  );
}
