import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-navy-800"
          >
            {label}
          </label>
        )}

        <div className="relative rounded-xl">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full text-xs sm:text-sm py-2.5 px-3.5 bg-cream-50 border rounded-xl text-navy-950 placeholder-navy-400/80 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-coral-500/30 focus:border-coral-500',
              error ? 'border-rose-400 focus:ring-rose-200' : 'border-cream-300',
              leftIcon ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-navy-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-navy-500 font-normal">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
