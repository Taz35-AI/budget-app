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
          <label htmlFor={id} className="text-sm font-semibold text-brand-text/80 dark:text-white/70">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-text/40 dark:text-white/30 pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full h-11 rounded-2xl border px-3.5 text-sm font-medium transition-all duration-100',
              'border-black/[0.08] bg-black/[0.02] text-brand-text placeholder:text-brand-text/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]',
              'dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/25 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]',
              'focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/40 focus:bg-white dark:focus:bg-white/[0.06]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              prefix && 'pl-8',
              error && 'border-brand-danger/50 focus:ring-brand-danger/30 focus:border-brand-danger/60',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-brand-danger dark:text-brand-danger/90">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export { Input };
