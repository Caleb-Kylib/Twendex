import {forwardRef, type ButtonHTMLAttributes} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '../../lib/utils';
const buttonVariants=cva('inline-flex items-center justify-center rounded-md font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-50',{variants:{variant:{default:'bg-teal-700 text-white',outline:'border border-slate-300 bg-white',destructive:'bg-red-700 text-white'},size:{default:'min-h-12 px-4',sm:'min-h-9 px-3'}},defaultVariants:{variant:'default',size:'default'}});
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>,VariantProps<typeof buttonVariants>{}
export const Button=forwardRef<HTMLButtonElement,ButtonProps>(({className,variant,size,...props},ref)=><button ref={ref} className={cn(buttonVariants({variant,size}),className)} {...props}/>);
Button.displayName='Button';
