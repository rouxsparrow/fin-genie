'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { recategorizeAll } from '@/app/actions/rule-actions';

export function RecategorizeButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    const result = await recategorizeAll();
    setIsLoading(false);

    if (result.success) {
      if (result.updated === 0) {
        toast('All transactions already match current rules. No changes needed.');
      } else {
        toast(
          `Re-categorization complete. ${result.updated} transactions updated, ${result.unchanged} unchanged.`,
        );
      }
    } else {
      toast.error('Re-categorization failed. Please try again.');
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Re-categorizing...
        </>
      ) : (
        'Re-categorize All'
      )}
    </Button>
  );
}
