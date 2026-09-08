import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, type, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={isPassword && isPasswordVisible ? 'text' : type}
            className={twMerge(
              clsx(
                'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors',
                isPassword && 'pr-10',
                error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
                className
              )
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
            >
              {isPasswordVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {helperText && !error && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
