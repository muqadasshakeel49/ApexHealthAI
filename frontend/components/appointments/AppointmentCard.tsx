import React, { useState } from 'react';
import { Calendar, Clock, FileText, Ban, AlertCircle } from 'lucide-react';
import { Appointment } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange?: (id: string, newStatus: 'CANCELLED') => Promise<void>;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onStatusChange
}) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString(
    'en-US',
    {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  );

  const handleCancel = async () => {
    if (!onStatusChange) return;
    try {
      setIsCancelling(true);
      await onStatusChange(appointment.id, 'CANCELLED');
      setShowConfirmCancel(false);
    } finally {
      setIsCancelling(false);
    }
  };

  const isCancellable = appointment.status === 'CONFIRMED' || appointment.status === 'PENDING';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-semibold text-slate-900 text-base">
            {appointment.service}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Ref: {appointment.id.slice(0, 8)}
          </p>
        </div>
        <Badge status={appointment.status} />
      </div>

      <div className="space-y-2 py-2 border-y border-slate-100 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{appointment.appointmentTime}</span>
        </div>
        {appointment.notes && (
          <div className="flex items-start gap-2 pt-1">
            <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 italic line-clamp-2">
              {appointment.notes}
            </p>
          </div>
        )}
      </div>

      {isCancellable && onStatusChange && (
        <div className="mt-4 pt-1 flex justify-end">
          {showConfirmCancel ? (
            <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-xl border border-rose-200 text-xs">
              <span className="text-rose-700 font-medium">Cancel appointment?</span>
              <Button
                size="sm"
                variant="danger"
                isLoading={isCancelling}
                onClick={handleCancel}
                className="py-1 px-2.5 text-xs"
              >
                Yes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowConfirmCancel(false)}
                className="py-1 px-2 text-xs"
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowConfirmCancel(true)}
              className="text-xs text-slate-400 hover:text-rose-600"
              leftIcon={<Ban className="w-3.5 h-3.5" />}
            >
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
