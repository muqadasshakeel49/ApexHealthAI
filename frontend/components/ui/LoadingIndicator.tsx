import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  label = 'Loading...',
  size = 'md',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-slate-500">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-600`} />
      {label && <p className="text-sm font-medium">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingIndicator;
