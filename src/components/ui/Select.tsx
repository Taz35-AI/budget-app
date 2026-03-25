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
          <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full h-10 rounded-xl border px-3 text-sm transition-all appearance-none',
            'border-slate-200 bg-white text-slate-900',
            'dark:border-white/10 dark:bg-[#1e2533] dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white/30 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1.25rem] pr-8',
            error && 'border-red-400 focus:ring-red-400',
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
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';
export { Select };
