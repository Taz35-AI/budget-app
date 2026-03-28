import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-brand-text/80 dark:text-white/70">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-brand-text/40 dark:text-white/30 pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full h-10 rounded-xl border px-3 text-sm transition-all',
              'border-brand-primary/15 bg-white text-brand-text placeholder:text-brand-text/30',
              'dark:border-brand-primary/20 dark:bg-[#122928] dark:text-white dark:placeholder:text-white/25',
              'focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              prefix && 'pl-7',
              error && 'border-brand-danger/50 focus:ring-brand-danger/30 focus:border-brand-danger/60',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-brand-danger dark:text-brand-danger/90">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export { Input };
