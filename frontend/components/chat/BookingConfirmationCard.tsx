import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import { ExtractedAppointment, Appointment } from '../../types';
import api from '../../lib/api';

interface BookingConfirmationCardProps {
  appointment: ExtractedAppointment;
  onConfirmed?: (createdAppointment: Appointment) => void;
  onOpenFallbackForm?: (data: Partial<ExtractedAppointment>) => void;
}

export const BookingConfirmationCard: React.FC<BookingConfirmationCardProps> = ({
  appointment,
  onConfirmed,
  onOpenFallbackForm
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!appointment.service || !appointment.date || !appointment.time) {
      setError('Missing appointment information. Please provide all details.');
      return;
    }

    try {
      setIsConfirming(true);
      setError(null);
      const created = await api.appointments.create({
        service: appointment.service,
        appointmentDate: appointment.date,
        appointmentTime: appointment.time,
        notes: appointment.notes || undefined
      });
      setConfirmed(true);
      if (onConfirmed) {
        onConfirmed(created);
      }
    } catch (err: any) {
      setError(err.message || 'Booking conflict or validation error occurred.');
    } finally {
      setIsConfirming(false);
    }
  };

  if (confirmed) {
    return (
      <div className="mt-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 animate-in fade-in">
        <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-1">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Appointment Successfully Booked!
        </div>
        <p className="text-xs text-emerald-700">
          Your slot has been reserved in PostgreSQL. You can view it anytime on your dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 to-white border border-indigo-200/90 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
        <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
          Appointment Proposal
        </span>
        <span className="text-[11px] font-medium text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-full">
          Ready to Confirm
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="col-span-2">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Service</span>
          <span className="font-semibold text-slate-800">{appointment.service || 'Not specified'}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
            <Calendar className="w-3 h-3 text-indigo-500" />
            {appointment.date || 'Not specified'}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Time</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-indigo-500" />
            {appointment.time || 'Not specified'}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
            {onOpenFallbackForm && (
              <button
                onClick={() => onOpenFallbackForm(appointment)}
                className="text-[11px] text-rose-700 underline font-semibold mt-1 hover:text-rose-900"
              >
                Modify details in booking form
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="primary"
          isLoading={isConfirming}
          onClick={handleConfirm}
          className="w-full text-xs py-2 shadow-sm font-semibold"
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Confirm & Book Appointment
        </Button>
      </div>
    </div>
  );
};

export default BookingConfirmationCard;
