import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-[480px] w-full">
        <Card>
          <CardContent className="p-8 text-center flex flex-col items-center">
            <SearchX size={48} className="opacity-50" />
            <div className="h-4" />
            <h1 className="text-2xl font-bold">Page not found</h1>
            <div className="h-2" />
            <p className="text-base font-medium opacity-60">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>
            <div className="h-6" />
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
