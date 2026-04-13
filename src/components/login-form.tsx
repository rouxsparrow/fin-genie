'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email address first.');
      return;
    }

    setError(null);
    setResetLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/auth/callback',
    });

    setResetLoading(false);
    toast('Check your email for a password reset link.');
  }

  return (
    <Card className="max-w-[480px] w-full bg-secondary-background">
      <CardContent className="p-4 flex flex-col">
        <h1 className="text-[32px] font-bold leading-tight">Fin Genie</h1>

        <form onSubmit={handleSubmit} className="flex flex-col mt-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 mt-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-4"
            disabled={loading}
            loading={loading}
            loadingText="Log In"
          >
            Log In
          </Button>

          {error && (
            <p className="text-[16px] text-red-500 mt-4 text-center">
              {error}
            </p>
          )}

          <Button
            type="button"
            variant="neutral"
            onClick={handleForgotPassword}
            className="w-full mt-4 text-[14px]"
            disabled={loading || resetLoading}
            loading={resetLoading}
            loadingText="Sending Reset Link"
          >
            Forgot your password?
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
