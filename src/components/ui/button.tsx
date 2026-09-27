import {forwardRef, type ButtonHTMLAttributes} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const buttonVariants = cva(
  'btn-shine inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none [&_svg]:size-[1.15em] [&_svg]:shrink-0 active:scale-[.98]',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-brand-500 to-clay-600 text-white shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 hover:-translate-y-0.5',
        glass:
          'glass text-brand-800 hover:bg-white/70 hover:-translate-y-0.5',
        outline:
          'border border-brand-200 bg-white/60 text-brand-800 backdrop-blur hover:bg-white/80 hover:border-brand-300',
        ghost: 'text-ink/80 hover:bg-brand-100/60 hover:text-brand-700',
        light: 'bg-white text-brand-700 shadow-lg shadow-brand-900/10 hover:bg-brand-50 hover:-translate-y-0.5',
        destructive: 'bg-gradient-to-br from-rose-500 to-clay-600 text-white shadow-lg shadow-rose-500/30 hover:-translate-y-0.5',
      },
      size: {
        default: 'min-h-12 px-5 text-[15px]',
        sm: 'min-h-9 px-3.5 text-sm',
        lg: 'min-h-14 px-7 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: {variant: 'default', size: 'default'},
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({className, variant, size, ...props}, ref) => (
    <button ref={ref} className={cn(buttonVariants({variant, size}), className)} {...props} />
  )
);
Button.displayName = 'Button';
export {buttonVariants};
