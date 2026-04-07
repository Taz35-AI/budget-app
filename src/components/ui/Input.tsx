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
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-brand-text/50 dark:text-white/40 font-display">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-text/35 dark:text-white/25 pointer-events-none font-display">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full h-12 rounded-2xl border px-4 text-sm font-medium transition-all duration-200',
              'border-black/[0.06] bg-white/60 text-brand-text placeholder:text-brand-text/30 backdrop-blur-sm',
              'dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/25 dark:backdrop-blur-sm',
              'focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30 focus:bg-white dark:focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(13,148,136,0.08)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              prefix && 'pl-8',
              error && 'border-brand-danger/40 focus:ring-brand-danger/20 focus:border-brand-danger/50',
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
