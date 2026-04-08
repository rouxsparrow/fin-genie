'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PdfDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isAdmin: boolean;
  disabled: boolean;
}

export function PdfDropZone({
  onFilesSelected,
  isAdmin,
  disabled,
}: PdfDropZoneProps) {
  const [errorFlash, setErrorFlash] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => {
      if (accepted.length > 0) onFilesSelected(accepted);
    },
    onDropRejected: (rejections) => {
      const count = rejections.length;
      if (count === 1) {
        const code = rejections[0]?.errors[0]?.code;
        if (code === 'file-too-large') {
          toast.error('File too large. Maximum size is 4MB.');
        } else if (code === 'file-invalid-type') {
          toast.error('Only PDF files are supported.');
        }
      } else {
        toast.error(
          `${count} file(s) rejected: only PDFs under 4MB are accepted.`,
        );
      }
      setErrorFlash(true);
      setTimeout(() => setErrorFlash(false), 1000);
    },
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 4 * 1024 * 1024,
    disabled: !isAdmin || disabled,
  });

  return (
    <div
      {...getRootProps()}
      aria-label="Upload PDF files"
      className={cn(
        'min-h-[240px] rounded-base border-2 border-dashed border-border bg-secondary-background transition-all duration-200',
        'flex flex-col items-center justify-center gap-2 px-6 py-8',
        isAdmin && !disabled && 'cursor-pointer hover:border-main',
        isDragActive && 'border-solid border-main bg-main/5',
        errorFlash && 'border-[#ef4444]',
        (!isAdmin || disabled) && 'cursor-not-allowed opacity-50',
      )}
    >
      <input {...getInputProps()} />
      <div aria-live="polite" className="flex flex-col items-center gap-2">
        <Upload
          className={cn(
            'text-main transition-all duration-200',
            isDragActive ? 'h-14 w-14' : 'h-12 w-12',
          )}
        />
        <p className="text-base font-medium opacity-60">
          {!isAdmin
            ? 'Only admins can import statements'
            : isDragActive
              ? 'Drop PDFs to upload'
              : 'Drag PDFs here or click to browse'}
        </p>
        {isAdmin && !isDragActive && (
          <p className="text-sm font-medium opacity-40">
            Citibank SG credit card statements only. Max 4MB each.
          </p>
        )}
      </div>
    </div>
  );
}
