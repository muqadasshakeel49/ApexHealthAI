'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import ErrorState from '../../components/ui/ErrorState';
import AppointmentList from '../../components/appointments/AppointmentList';
import AppointmentForm from '../../components/appointments/AppointmentForm';
import api from '../../lib/api';
import { Appointment } from '../../types';

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.appointments.list();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        fetchAppointments();
      }
    }
  }, [user, authLoading, router, fetchAppointments]);

  const handleStatusChange = async (id: string, newStatus: 'CANCELLED') => {
    try {
      await api.appointments.updateStatus(id, newStatus);
      await fetchAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status');
    }
  };

  if (authLoading || (!user && !error)) {
    return <LoadingIndicator fullScreen label="Loading appointments..." />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenBookModal={() => setIsBookModalOpen(true)} />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Appointments Management
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                View, filter, and manage all your scheduled appointments.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/assistant')}
                leftIcon={<Sparkles className="w-4 h-4 text-indigo-600" />}
              >
                Book with AI
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsBookModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                New Appointment
              </Button>
            </div>
          </div>

          {error && <ErrorState message={error} onRetry={fetchAppointments} />}

          {isLoading ? (
            <div className="p-16 text-center">
              <LoadingIndicator label="Loading appointments..." />
            </div>
          ) : (
            <AppointmentList
              appointments={appointments}
              onStatusChange={handleStatusChange}
              onOpenBookModal={() => setIsBookModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Manual Booking Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule New Appointment"
        description="Select a service and preferred date & time slot."
      >
        <AppointmentForm
          onSuccess={() => {
            setIsBookModalOpen(false);
            fetchAppointments();
          }}
          onCancel={() => setIsBookModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
