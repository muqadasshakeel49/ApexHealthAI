'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import Navbar from '../../components/layout/Navbar';
import Modal from '../../components/ui/Modal';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import ChatPanel from '../../components/chat/ChatPanel';
import AppointmentForm from '../../components/appointments/AppointmentForm';
import { ExtractedAppointment, Appointment } from '../../types';

export default function AssistantPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [isFallbackModalOpen, setIsFallbackModalOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<ExtractedAppointment> | undefined>(
    undefined
  );

  if (authLoading || !user) {
    return <LoadingIndicator fullScreen label="Loading AI Assistant..." />;
  }

  const handleOpenFallbackForm = (data?: Partial<ExtractedAppointment>) => {
    setExtractedData(data);
    setIsFallbackModalOpen(true);
  };

  const handleAppointmentBooked = (_appointment: Appointment) => {
    // Optionally redirect to appointments page after 1.5s
    setTimeout(() => {
      router.push('/appointments');
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar />

        <main className="flex-1 p-6 max-w-5xl w-full mx-auto flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <ChatPanel
              onAppointmentBooked={handleAppointmentBooked}
              onOpenFallbackForm={handleOpenFallbackForm}
            />
          </div>
        </main>
      </div>

      {/* Fallback Structured Appointment Modal */}
      <Modal
        isOpen={isFallbackModalOpen}
        onClose={() => setIsFallbackModalOpen(false)}
        title="Structured Appointment Booking"
        description="Book your appointment directly using this form."
      >
        <AppointmentForm
          initialData={extractedData}
          onSuccess={() => {
            setIsFallbackModalOpen(false);
            router.push('/appointments');
          }}
          onCancel={() => setIsFallbackModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
