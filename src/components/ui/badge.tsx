import {type HTMLAttributes} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold [&_svg]:size-3.5',
  {
    variants: {
      variant: {
        glass: 'glass text-brand-800 px-3.5 py-1.5 text-xs',
        warm: 'bg-brand-100/80 text-brand-800 border border-brand-200/70 px-3 py-1 text-xs',
        solid: 'bg-brand-600 text-white px-3 py-1 text-xs',
        eyebrow: 'text-brand-600 text-[11px] tracking-[0.15em] uppercase px-0',
      },
    },
    defaultVariants: {variant: 'glass'},
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({className, variant, ...props}: BadgeProps) {
  return <span className={cn(badgeVariants({variant}), className)} {...props} />;
}
