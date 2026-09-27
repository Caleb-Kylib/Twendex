import {forwardRef, type HTMLAttributes} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const cardVariants = cva('rounded-2xl transition-all duration-200', {
  variants: {
    variant: {
      glass: 'glass',
      strong: 'glass-strong',
      warm: 'glass-warm',
      dark: 'glass-dark text-cream',
      solid: 'bg-white/80 border border-brand-100 shadow-sm',
    },
    hover: {
      lift: 'hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/15',
      none: '',
    },
  },
  defaultVariants: {variant: 'glass', hover: 'none'},
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({className, variant, hover, ...props}, ref) => (
    <div ref={ref} className={cn(cardVariants({variant, hover}), className)} {...props} />
  )
);
Card.displayName = 'Card';
