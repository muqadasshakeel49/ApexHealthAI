'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  BotMessageSquare,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', href: '/appointments', icon: Calendar },
    { label: 'AI Assistant', href: '/assistant', icon: BotMessageSquare }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight block text-base leading-tight">
            ApexHealth AI
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
            Booking SaaS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 px-3 py-2 uppercase tracking-wider">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
