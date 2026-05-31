import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-pm-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pm-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-pm-gold text-white hover:bg-pm-gold-dark shadow-sm',
        destructive: 'bg-pm-error text-white hover:bg-red-700',
        outline: 'border border-pm-border bg-white hover:bg-pm-cream text-pm-text',
        secondary: 'bg-pm-cream text-pm-text hover:bg-pm-gold/10',
        ghost: 'text-pm-text-secondary hover:text-pm-text hover:bg-muted',
        link: 'text-pm-gold underline-offset-4 hover:underline',
        buy: 'bg-green-700 text-white hover:bg-green-800',
        whatsapp: 'bg-green-500 text-white hover:bg-green-600',
        visit: 'bg-blue-700 text-white hover:bg-blue-800',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-pm-sm px-3 text-xs',
        lg: 'h-12 rounded-pm-md px-8 text-base',
        xl: 'h-14 rounded-pm-lg px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
