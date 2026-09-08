'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Bot,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/layout/Navbar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import ErrorState from '../../components/ui/ErrorState';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import AppointmentForm from '../../components/appointments/AppointmentForm';
import ChatPanel from '../../components/chat/ChatPanel';
import api from '../../lib/api';
import { Appointment } from '../../types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authFlow, setAuthFlow] = useState<'login' | 'register'>('login');

  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoadingAppointments(true);
      setError(null);
      const data = await api.appointments.list();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load appointments.');
    } finally {
      setIsLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    const flow = sessionStorage.getItem('auth-flow');
    if (flow === 'register') {
      setAuthFlow('register');
    }
    sessionStorage.removeItem('auth-flow');
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
    return <LoadingIndicator fullScreen label="Loading your dashboard..." />;
  }

  // Calculate statistics
  const confirmedAppointments = appointments.filter((a) => a.status === 'CONFIRMED');
  const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED');
  const cancelledAppointments = appointments.filter((a) => a.status === 'CANCELLED');

  const upcomingAppointments = confirmedAppointments.slice(0, 4);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenBookModal={() => setIsBookModalOpen(true)} />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {authFlow === 'register' ? 'Welcome' : 'Welcome back'}, {user?.name || 'there'}!
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your appointments or book instantly with our conversational AI.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsBookModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Manual Booking
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsChatModalOpen(true)}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="shadow-sm shadow-indigo-200"
              >
                Book with AI
              </Button>
            </div>
          </div>

          {error && <ErrorState message={error} onRetry={fetchAppointments} />}

          {/* Stats Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Bookings
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {appointments.length}
                </h3>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Upcoming
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {confirmedAppointments.length}
                </h3>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Completed
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {completedAppointments.length}
                </h3>
              </div>
            </Card>

            <Card className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Cancelled
                </p>
                <h3 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {cancelledAppointments.length}
                </h3>
              </div>
            </Card>
          </div>

          {/* Main Dashboard Section: Upcoming & AI Assistant Callout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Cols: Upcoming Appointments */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Upcoming Appointments
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push('/appointments')}
                  className="text-xs text-indigo-600 font-semibold"
                >
                  View All ({appointments.length})
                </Button>
              </div>

              {isLoadingAppointments ? (
                <div className="p-12 text-center">
                  <LoadingIndicator label="Loading appointments..." />
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800">
                    No upcoming appointments
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                    You have no upcoming appointments scheduled at this moment.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsChatModalOpen(true)}
                    leftIcon={<Bot className="w-4 h-4" />}
                  >
                    Schedule with AI
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingAppointments.map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right 1 Col: AI Assistant Quick Action Box */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-200">
                <Bot className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-lg font-bold">Try AI-Assisted Booking</h4>
                <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                  Simply tell the AI what you need in natural language. E.g.:
                  <br />
                  <span className="italic opacity-90 block mt-1">
                    &quot;I need a dentist tomorrow at 3 PM&quot;
                  </span>
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="secondary"
                  className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs py-2.5"
                  onClick={() => setIsChatModalOpen(true)}
                  leftIcon={<Sparkles className="w-4 h-4 text-indigo-600" />}
                >
                  Open AI Chat Assistant
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Manual Booking Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule New Appointment"
        description="Fill in the details below to reserve your appointment slot."
      >
        <AppointmentForm
          onSuccess={() => {
            setIsBookModalOpen(false);
            fetchAppointments();
          }}
          onCancel={() => setIsBookModalOpen(false)}
        />
      </Modal>

      {/* Embedded AI Chat Assistant Modal */}
      <Modal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        title="AI Appointment Assistant"
        description="Have a natural conversation to schedule your appointment."
        maxWidth="lg"
      >
        <div className="h-[480px]">
          <ChatPanel
            onAppointmentBooked={() => {
              fetchAppointments();
            }}
            onOpenFallbackForm={() => {
              setIsChatModalOpen(false);
              setIsBookModalOpen(true);
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
