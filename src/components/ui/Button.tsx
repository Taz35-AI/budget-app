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
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-brand-primary text-white hover:bg-brand-primary/90 focus-visible:ring-brand-primary shadow-sm': variant === 'primary',
            'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/18 focus-visible:ring-brand-primary/40 dark:bg-brand-primary/15 dark:text-brand-primary dark:hover:bg-brand-primary/25': variant === 'secondary',
            'text-brand-text/60 hover:text-brand-text hover:bg-brand-primary/8 focus-visible:ring-brand-primary/30 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/8': variant === 'ghost',
            'bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/18 focus-visible:ring-brand-danger/40 dark:bg-brand-danger/15 dark:hover:bg-brand-danger/25': variant === 'danger',
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
