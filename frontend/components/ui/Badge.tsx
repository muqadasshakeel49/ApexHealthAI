import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AppointmentStatus } from '../../types';

interface BadgeProps {
  status?: AppointmentStatus | string;
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, className, children }) => {
  const statusStyles: Record<string, string> = {
    CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20',
    COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20'
  };

  const currentStatus = (status || children || '').toString().toUpperCase();
  const appliedStyle = statusStyles[currentStatus] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
          appliedStyle,
          className
        )
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {children || currentStatus}
    </span>
  );
};

export default Badge;
