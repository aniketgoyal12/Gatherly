import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionNode?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionNode,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl bg-cream-50 border border-cream-300 shadow-xs max-w-md mx-auto space-y-4',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-coral-50 border border-coral-200 text-coral-600 flex items-center justify-center shadow-xs">
          {icon}
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-navy-950 tracking-tight">{title}</h3>
        <p className="text-xs text-navy-600 leading-relaxed max-w-sm">{description}</p>
      </div>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}

      {actionNode}
    </div>
  );
};

export default EmptyState;
