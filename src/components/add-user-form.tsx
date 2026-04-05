'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createUser } from '@/app/actions/user-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';

interface FieldErrors {
  email?: string;
  fullName?: string;
}

export function AddUserForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setEmail('');
    setFullName('');
    setRole('viewer');
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: FieldErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    startTransition(async () => {
      const result = await createUser({
        email: email.trim(),
        fullName: fullName.trim(),
        role,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Account created. ${fullName.trim()} will receive a login email.`,
        );
        resetForm();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus size={16} />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Household Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              disabled={isPending}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName)
                  setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              disabled={isPending}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value: string) =>
                setRole(value as 'admin' | 'viewer')
              }
              disabled={isPending}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Creating...' : 'Create Account'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
