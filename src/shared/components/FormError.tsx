import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  error?: string;
  className?: string;
}

export function FormError({ error, className = '' }: FormErrorProps) {
  if (!error) return null;
  return (
    <p className={`flex items-center gap-1 text-xs text-red-500 mt-1 ${className}`}>
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {error}
    </p>
  );
}
