import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = ''
}) => {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 ${className}`}
    >
      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        <h5 className="font-semibold">{title}</h5>
        <p className="mt-0.5 text-rose-700">{message}</p>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="mt-3 bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
