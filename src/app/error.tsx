'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-[480px] w-full">
        <Card>
          <CardContent className="p-8 text-center flex flex-col items-center">
            <AlertTriangle size={48} className="opacity-50" />
            <div className="h-4" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <div className="h-2" />
            <p className="text-base font-medium opacity-60">
              We hit an unexpected error. Try refreshing, or head back to the
              dashboard.
            </p>
            <div className="h-6" />
            <div className="flex gap-3">
              <Button onClick={reset}>Try Again</Button>
              <Button variant="neutral" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
