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
          'inline-flex items-center justify-center rounded-2xl font-bold tracking-tight transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed select-none',
          {
            'bg-brand-primary text-white hover:brightness-110 focus-visible:ring-brand-primary shadow-[0_2px_8px_rgba(13,148,136,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]': variant === 'primary',
            'bg-brand-primary/12 text-brand-primary hover:bg-brand-primary/20 focus-visible:ring-brand-primary/40 dark:bg-brand-primary/15 dark:text-teal-200 dark:hover:bg-brand-primary/25 shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]': variant === 'secondary',
            'text-brand-text/70 hover:text-brand-text hover:bg-black/[0.04] active:bg-black/[0.08] focus-visible:ring-brand-primary/30 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[0.06] dark:active:bg-white/[0.1]': variant === 'ghost',
            'bg-brand-danger text-white hover:brightness-110 focus-visible:ring-brand-danger/40 shadow-[0_2px_8px_rgba(220,38,38,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]': variant === 'danger',
          },
          {
            'h-9 px-3.5 text-xs gap-1.5': size === 'sm',
            'h-11 px-5 text-sm gap-2': size === 'md',
            'h-[3.25rem] px-7 text-base gap-2.5': size === 'lg',
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
