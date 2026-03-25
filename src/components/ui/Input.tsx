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
          <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 dark:text-slate-400 pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full h-10 rounded-xl border px-3 text-sm transition-all',
              'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400',
              'dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30',
              'focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/30 focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              prefix && 'pl-7',
              error && 'border-red-400 focus:ring-red-400',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export { Input };
