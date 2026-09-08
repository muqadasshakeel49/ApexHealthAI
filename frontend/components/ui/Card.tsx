import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, hover = false, children, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200',
          hover && 'hover:border-indigo-200 hover:shadow-md',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={twMerge(clsx('flex items-center justify-between pb-4 mb-4 border-b border-slate-100', className))} {...props}>
      {children}
    </div>
  );
};

export default Card;
