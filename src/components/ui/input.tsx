import {forwardRef, type InputHTMLAttributes} from 'react';
import {cn} from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({className, ...props}, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full min-h-11 rounded-xl border border-brand-200/70 bg-white/70 px-3.5 text-ink placeholder:text-muted/70 backdrop-blur transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-300/50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({className, ...props}, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full min-h-11 rounded-xl border border-brand-200/70 bg-white/70 px-3.5 text-ink backdrop-blur transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-300/50',
        className
      )}
      {...props}
    />
  )
);
Select.displayName = 'Select';
