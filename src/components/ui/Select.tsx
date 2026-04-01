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
          <label htmlFor={id} className="text-sm font-medium text-brand-text/80 dark:text-white/70">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full h-10 rounded-xl border px-3 text-sm transition-all appearance-none',
            'border-brand-primary/15 bg-white text-brand-text',
            'dark:border-brand-primary/20 dark:bg-[#042F2E] dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%233B7A78\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.25rem] pr-8',
            error && 'border-brand-danger/50 focus:ring-brand-danger/30',
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
        {error && <p className="text-xs text-brand-danger dark:text-brand-danger/90">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
export { Select };
