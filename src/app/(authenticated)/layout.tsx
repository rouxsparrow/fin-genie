import { AppSidebar } from '@/components/app-sidebar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 bg-background p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
