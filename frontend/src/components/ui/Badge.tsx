import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'coral' | 'navy' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  ...props
}) => {
  const base = 'inline-flex items-center font-bold uppercase tracking-wider rounded-full';

  const variants = {
    default: 'bg-cream-200 text-navy-800 border border-cream-300',
    coral: 'bg-coral-50 text-coral-600 border border-coral-200',
    navy: 'bg-navy-950 text-cream-100 border border-navy-800',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
  };

  const dots = {
    default: 'bg-navy-500',
    coral: 'bg-coral-500',
    navy: 'bg-cream-100',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dots[variant])} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
