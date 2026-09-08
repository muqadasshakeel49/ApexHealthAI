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
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          AI Scheduler Active
        </span>
      </div>

      <div className="flex items-center gap-3">
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
