import React, { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, helperText, id, options, ...props }, ref) => {
    const generatedId = id || React.useId();
    
    return (
      <div className="flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={generatedId} className="text-sm font-medium text-brand-charcoal">
            {label}
          </label>
        )}
        <select
          id={generatedId}
          ref={ref}
          className={`
            flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm 
            focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent
            disabled:cursor-not-allowed disabled:opacity-50 transition-colors
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {helperText && !error && <p className="text-sm text-brand-gray">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
