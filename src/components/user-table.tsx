'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Profile, UserRole } from '@/lib/types/database';
import { removeUser, updateUserRole } from '@/app/actions/user-management';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UserTableProps {
  profiles: Profile[];
  currentUserId: string;
}

export function UserTable({ profiles, currentUserId }: UserTableProps) {
  const [removeTarget, setRemoveTarget] = useState<Profile | null>(null);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const otherProfiles = profiles.filter((p) => p.id !== currentUserId);

  function handleRoleChange(profile: Profile, newRole: UserRole) {
    startTransition(async () => {
      const result = await updateUserRole({
        userId: profile.id,
        newRole,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `${profile.full_name} is now a ${newRole === 'admin' ? 'Admin' : 'Viewer'}.`,
        );
      }
    });
  }

  function handleRemoveConfirm() {
    if (!removeTarget) return;

    const target = removeTarget;
    setPendingRemovalId(target.id);
    startTransition(async () => {
      const result = await removeUser({ userId: target.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${target.full_name} has been removed.`);
      }
      setRemoveTarget(null);
      setPendingRemovalId(null);
    });
  }

  if (otherProfiles.length === 0) {
    return (
      <div className="border-2 border-border rounded-base p-8 text-center">
        <p className="text-base font-medium opacity-60">
          No other members yet. Add someone to share your spending data.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Role</TableHead>
              <TableHead className="font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile, index) => (
              <TableRow
                key={profile.id}
                className={
                  index % 2 === 0
                    ? 'bg-secondary-background'
                    : 'even:bg-background'
                }
              >
                <TableCell className="font-bold text-sm">
                  {profile.full_name}
                </TableCell>
                <TableCell className="text-sm">{profile.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={profile.role === 'admin' ? 'default' : 'neutral'}
                    className={
                      profile.role === 'admin' ? 'bg-main' : undefined
                    }
                  >
                    {profile.role === 'admin' ? 'Admin' : 'Viewer'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {profile.id !== currentUserId && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={profile.role}
                        onValueChange={(value: string) =>
                          handleRoleChange(
                            profile,
                            value as UserRole,
                          )
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="neutral"
                        size="sm"
                        className="text-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => setRemoveTarget(profile)}
                        disabled={isPending}
                      >
                        Remove Member
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden flex flex-col gap-3">
        {profiles.map((profile) => (
          <Card key={profile.id}>
            <CardContent className="p-4 flex flex-col gap-3">
              <div>
                <p className="text-sm font-bold">{profile.full_name}</p>
                <p className="text-sm opacity-60">{profile.email}</p>
              </div>
              <Badge
                variant={profile.role === 'admin' ? 'default' : 'neutral'}
                className={profile.role === 'admin' ? 'bg-main' : undefined}
              >
                {profile.role === 'admin' ? 'Admin' : 'Viewer'}
              </Badge>
              {profile.id !== currentUserId && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Select
                    value={profile.role}
                    onValueChange={(value: string) =>
                      handleRoleChange(profile, value as UserRole)
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="neutral"
                    size="sm"
                    className="text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={() => setRemoveTarget(profile)}
                    disabled={isPending}
                  >
                    Remove Member
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Remove confirmation dialog */}
      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {removeTarget?.full_name}</DialogTitle>
            <DialogDescription>
              This will permanently remove {removeTarget?.full_name} from the
              household. They will no longer be able to log in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="neutral"
              onClick={() => setRemoveTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="neutral"
              className="text-red-500 hover:bg-red-500 hover:text-white"
              onClick={handleRemoveConfirm}
              disabled={isPending}
              loading={isPending && pendingRemovalId === removeTarget?.id}
              loadingText="Removing Member"
            >
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
