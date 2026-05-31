import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-pm-full px-2.5 py-0.5 text-pm-tiny font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-pm-gold/10 text-pm-gold border border-pm-gold/20',
        secondary: 'bg-pm-burgundy/10 text-pm-burgundy',
        destructive: 'bg-pm-error/10 text-pm-error',
        success: 'bg-pm-success/10 text-pm-success',
        warning: 'bg-pm-warning/10 text-pm-warning',
        info: 'bg-pm-info/10 text-pm-info',
        outline: 'border border-pm-border text-pm-text-secondary',
        buy: 'bg-mode-buy text-white',
        whatsapp: 'bg-mode-whatsapp text-white',
        visit: 'bg-mode-visit text-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
