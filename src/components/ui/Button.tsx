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
          'inline-flex items-center justify-center rounded-full font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed select-none',
          {
            'bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:shadow-[0_4px_20px_rgba(13,148,136,0.4)] focus-visible:ring-brand-primary shadow-[0_2px_12px_rgba(13,148,136,0.3)] active:shadow-[0_1px_4px_rgba(13,148,136,0.2)]': variant === 'primary',
            'bg-white/70 dark:bg-white/[0.08] text-brand-primary dark:text-teal-200 hover:bg-white dark:hover:bg-white/[0.12] focus-visible:ring-brand-primary/40 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-white/80 dark:border-white/[0.1] backdrop-blur-sm': variant === 'secondary',
            'text-brand-text/60 hover:text-brand-text hover:bg-brand-primary/[0.06] active:bg-brand-primary/[0.1] focus-visible:ring-brand-primary/30 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/[0.06] dark:active:bg-white/[0.1]': variant === 'ghost',
            'bg-gradient-to-r from-brand-danger to-red-500 text-white hover:shadow-[0_4px_20px_rgba(220,38,38,0.35)] focus-visible:ring-brand-danger/40 shadow-[0_2px_12px_rgba(220,38,38,0.25)] active:shadow-[0_1px_4px_rgba(220,38,38,0.2)]': variant === 'danger',
          },
          {
            'h-8 px-3.5 text-xs gap-1.5': size === 'sm',
            'h-11 px-6 text-sm gap-2': size === 'md',
            'h-13 px-8 text-base gap-2.5': size === 'lg',
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
