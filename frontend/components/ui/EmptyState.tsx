import React, { ReactNode } from 'react';
import { CalendarX } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <CalendarX className="w-10 h-10 text-slate-400" />,
  title,
  description,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-3">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 max-w-sm mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
