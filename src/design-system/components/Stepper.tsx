/**
 * UAMEX ERP™ — Stepper Component
 * Compound component: Stepper, Step
 * Adapted from NICYE design-system components/Stepper/ with Tailwind CSS
 */

import React from 'react';
import { cn } from '../utils/cn';
import { type LucideIcon } from 'lucide-react';

export interface StepData {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon?: LucideIcon;
}

export interface StepperProps {
  steps: StepData[];
  currentStep: number;
  lang?: 'ar' | 'en';
  className?: string;
}

export function Stepper({ steps, currentStep, lang = 'ar', className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn('flex items-center gap-2', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors shrink-0',
                  isCompleted && 'bg-emerald-500 text-white',
                  isCurrent && 'bg-emerald-600 text-white ring-2 ring-emerald-300 dark:ring-emerald-700',
                  !isCompleted && !isCurrent && 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : Icon ? (
                  <Icon className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className={cn('hidden sm:block', isCurrent && 'font-semibold')}>
                <p className="text-sm text-zinc-900 dark:text-white">
                  {lang === 'ar' ? step.titleAr : step.titleEn}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2', isCompleted ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700')} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
