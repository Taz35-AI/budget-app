import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:focus-visible:ring-white': variant === 'primary',
            'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20': variant === 'secondary',
            'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-300 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10': variant === 'ghost',
            'bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-400 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50': variant === 'danger',
          },
          {
            'h-8 px-3 text-xs gap-1.5': size === 'sm',
            'h-10 px-4 text-sm gap-2': size === 'md',
            'h-12 px-6 text-base gap-2': size === 'lg',
          },
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export { Button };
