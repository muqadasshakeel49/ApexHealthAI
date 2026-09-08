'use client';

import React from 'react';
import { BotMessageSquare, Plus } from 'lucide-react';
import Link from 'next/link';
import Button from '../ui/Button';

interface NavbarProps {
  onOpenBookModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBookModal }) => {
  return (
    <header className="min-h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI Scheduler Active
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
        {onOpenBookModal && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenBookModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Manual Booking
          </Button>
        )}
        <Link href="/assistant">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<BotMessageSquare className="w-4 h-4" />}
          >
            Book with AI
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
