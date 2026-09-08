import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ErrorState from '../ui/ErrorState';
import api from '../../lib/api';
import { Appointment, ExtractedAppointment } from '../../types';
import { CheckCircle2, Calendar, Clock } from 'lucide-react';

interface AppointmentFormProps {
  initialData?: Partial<ExtractedAppointment>;
  onSuccess?: (appointment: Appointment) => void;
  onCancel?: () => void;
}

const COMMON_SERVICES = [
  'General Dental Checkup',
  'Dermatology Consultation',
  'Cardiology Consultation',
  'Eye Examination',
  'Physical Therapy',
  'General Health Consultation'
];

const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30'
];

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  initialData,
  onSuccess,
  onCancel
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [service, setService] = useState(initialData?.service || COMMON_SERVICES[0]);
  const [appointmentDate, setAppointmentDate] = useState(initialData?.date || todayStr);
  const [appointmentTime, setAppointmentTime] = useState(initialData?.time || '14:00');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate fields
    if (!service) {
      setErrorMessage('Please select an appointment service.');
      return;
    }
    if (!appointmentDate) {
      setErrorMessage('Please select an appointment date.');
      return;
    }
    if (appointmentDate < todayStr) {
      setErrorMessage('Appointment date cannot be in the past.');
      return;
    }
    if (!appointmentTime) {
      setErrorMessage('Please select an appointment time.');
      return;
    }

    try {
      setIsSubmitting(true);
      const appointment = await api.appointments.create({
        service,
        appointmentDate,
        appointmentTime,
        notes: notes.trim() || undefined
      });

      setCreatedAppointment(appointment);
      if (onSuccess) {
        onSuccess(appointment);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to schedule appointment. Please verify details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdAppointment) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h4 className="text-lg font-bold text-slate-900">Appointment Confirmed!</h4>
        <p className="text-sm text-slate-600 max-w-sm mx-auto">
          Your <span className="font-semibold text-slate-800">{createdAppointment.service}</span> appointment is scheduled for{' '}
          <span className="font-semibold text-slate-800">
            {new Date(createdAppointment.appointmentDate).toLocaleDateString()}
          </span>{' '}
          at <span className="font-semibold text-slate-800">{createdAppointment.appointmentTime}</span>.
        </p>
        <div className="pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setCreatedAppointment(null);
              if (onCancel) onCancel();
            }}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <ErrorState message={errorMessage} className="py-2.5 px-3 text-xs" />
      )}

      {/* Service Selection */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Service Type
        </label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {COMMON_SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Date & Time Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Date
          </label>
          <div className="relative">
            <input
              type="date"
              min={todayStr}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Time Slot
          </label>
          <select
            value={appointmentTime}
            onChange={(e) => setAppointmentTime(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Notes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Notes (Optional)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any specific requests or symptoms..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          leftIcon={<Calendar className="w-4 h-4" />}
        >
          Book Appointment
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;
