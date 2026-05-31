import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-pm-md text-pm-button font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-pm-gold text-white hover:bg-pm-gold-dark shadow-sm',
        destructive: 'bg-pm-error text-white hover:bg-red-600',
        outline: 'border border-pm-border bg-white hover:bg-muted text-pm-text',
        secondary: 'bg-pm-burgundy text-white hover:bg-pm-burgundy/90',
        ghost: 'hover:bg-muted text-pm-text',
        link: 'text-pm-gold underline-offset-4 hover:underline',
        'mode-buy': 'bg-mode-buy text-white hover:bg-green-700',
        'mode-whatsapp': 'bg-mode-whatsapp text-white hover:bg-green-600',
        'mode-visit': 'bg-mode-visit text-white hover:bg-blue-700',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 rounded-pm-md px-3 text-pm-small',
        lg: 'h-12 rounded-pm-md px-8',
        xl: 'h-14 rounded-pm-md px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
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
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
