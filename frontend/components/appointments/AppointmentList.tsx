import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '../../types';
import AppointmentCard from './AppointmentCard';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import { Plus, CalendarDays } from 'lucide-react';

interface AppointmentListProps {
  appointments: Appointment[];
  onStatusChange?: (id: string, newStatus: 'CANCELLED') => Promise<void>;
  onOpenBookModal?: () => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  onStatusChange,
  onOpenBookModal
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | AppointmentStatus>('ALL');

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'ALL') return true;
    return apt.status === activeTab;
  });

  const tabs = [
    { label: 'All', value: 'ALL', count: appointments.length },
    {
      label: 'Confirmed',
      value: 'CONFIRMED',
      count: appointments.filter((a) => a.status === 'CONFIRMED').length
    },
    {
      label: 'Completed',
      value: 'COMPLETED',
      count: appointments.filter((a) => a.status === 'COMPLETED').length
    },
    {
      label: 'Cancelled',
      value: 'CANCELLED',
      count: appointments.filter((a) => a.status === 'CANCELLED').length
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === tab.value
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.value
                  ? 'bg-indigo-200/60 text-indigo-800'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid or Empty State */}
      {filteredAppointments.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-10 h-10 text-slate-400" />}
          title={`No ${activeTab.toLowerCase()} appointments`}
          description="You don't have any appointments matching the current filter."
          action={
            onOpenBookModal ? (
              <Button
                size="sm"
                variant="primary"
                onClick={onOpenBookModal}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Schedule Now
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
