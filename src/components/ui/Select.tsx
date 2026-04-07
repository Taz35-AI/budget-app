import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-brand-text/50 dark:text-white/40 font-display">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full h-12 rounded-2xl border px-4 text-sm font-medium transition-all duration-200 appearance-none',
            'border-black/[0.06] bg-white/60 text-brand-text backdrop-blur-sm',
            'dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:backdrop-blur-sm',
            '[&>option]:bg-white [&>option]:text-brand-text dark:[&>option]:bg-[#042F2E] dark:[&>option]:text-white',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30 focus:bg-white dark:focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(13,148,136,0.08)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%230D9488\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem] pr-9',
            error && 'border-brand-danger/40 focus:ring-brand-danger/20',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs font-medium text-brand-danger dark:text-brand-danger/90">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
export { Select };
