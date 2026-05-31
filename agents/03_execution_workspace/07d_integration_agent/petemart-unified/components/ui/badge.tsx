import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-pm-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-pm-gold focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-pm-gold text-white shadow',
        secondary: 'border-transparent bg-pm-cream text-pm-text-secondary',
        destructive: 'border-transparent bg-pm-error text-white',
        outline: 'text-pm-text border-pm-border',
        buy: 'border-transparent bg-green-100 text-green-800',
        whatsapp: 'border-transparent bg-green-50 text-green-700 border-green-300',
        visit: 'border-transparent bg-blue-100 text-blue-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
