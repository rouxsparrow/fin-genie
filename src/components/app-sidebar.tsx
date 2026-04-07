'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Upload,
  ListFilter,
  Tags,
  Settings,
  Menu,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/lib/hooks/use-profile';
import { SidebarNavItem } from '@/components/sidebar-nav-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { type LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  disabled: boolean;
  adminOnly: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', disabled: false, adminOnly: false },
  { label: 'Transactions', icon: Receipt, href: '/transactions', disabled: false, adminOnly: false },
  { label: 'Import', icon: Upload, href: '/import', disabled: false, adminOnly: true },
  { label: 'Rules', icon: ListFilter, href: '/rules', disabled: false, adminOnly: true },
  { label: 'Categories', icon: Tags, href: '/categories', disabled: false, adminOnly: true },
  { label: 'Settings', icon: Settings, href: '/settings', disabled: false, adminOnly: true },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[14px] w-[80%]" />
      ))}
      <Separator className="my-4" />
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="h-[14px] w-[60%]" />
      </div>
    </div>
  );
}

function SidebarContent({
  items,
  pathname,
  profile,
  loading,
  onLogout,
}: {
  items: NavItem[];
  pathname: string;
  profile: ReturnType<typeof useProfile>['profile'];
  loading: boolean;
  onLogout: () => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Fin Genie</h1>
        </div>
        <SidebarSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6">
        <h1 className="text-2xl font-bold">Fin Genie</h1>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 px-3">
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <SidebarNavItem
              key={item.href}
              label={item.label}
              icon={item.icon}
              href={item.href}
              active={pathname === item.href || pathname.startsWith(item.href + '/')}
              disabled={item.disabled}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      {profile && (
        <div className="mt-auto">
          <Separator />
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-main border-2 border-border flex items-center justify-center text-sm font-bold">
                {getInitials(profile.full_name)}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold">{profile.full_name}</span>
                <Badge
                  variant={profile.role === 'admin' ? 'default' : 'neutral'}
                  aria-label={`Role: ${profile.role === 'admin' ? 'Admin' : 'Viewer'}`}
                >
                  {profile.role === 'admin' ? 'Admin' : 'Viewer'}
                </Badge>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  );

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col border-r-2 border-border bg-secondary-background shrink-0">
        <SidebarContent
          items={visibleItems}
          pathname={pathname}
          profile={profile}
          loading={loading}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile hamburger + drawer */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="neutral" size="icon" className="w-11 h-11">
              <Menu size={24} />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent
              items={visibleItems}
              pathname={pathname}
              profile={profile}
              loading={loading}
              onLogout={handleLogout}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
