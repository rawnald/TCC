'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { UserRole } from '@/types';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Terminal,
  Clock,
  LogOut,
  LogIn,
  Radio,
  Sparkles,
  Activity,
} from 'lucide-react';
import { Canvas } from 'leaflet';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenSnapshot: () => void;
  isSnapshotting: boolean;
}

export default function Navbar({ onOpenAuth, onOpenSnapshot, isSnapshotting }: NavbarProps) {
  const { user, role, signOut } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return {
          label: 'ADMINISTRATOR',
          color: 'bg-slate-800 text-white border-slate-700 shadow-sm',
          icon: <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-blue-300" />,
        };
      case 'operator':
        return {
          label: 'OPERATOR',
          color: 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm',
          icon: <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-blue-600" />,
        };
      case 'viewer':
        return {
          label: 'VIEWER (READ-ONLY)',
          color: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-500" />,
        };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Left: Branding & Status */}
      <div className="flex items-center space-x-3.5">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm text-white shrink-0">
          <Terminal className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-sans font-bold tracking-tight text-sm sm:text-base text-slate-900">
              Tactical Command Center
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-sans">
            <span className="text-blue-600 font-medium">Joint Task Force Central</span>
          </div>
        </div>
      </div>

      {/* Right: Real-time UTC Clock, Role Indicator, User Info & Auth */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Real-time Clock */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-sans text-slate-700">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold tracking-wide">{timeStr || '12:00:00 UTC'}</span>
        </div>

        {/* Active Role Indicator Badge */}
        {user && (
          <div className={`hidden sm:flex items-center px-3 py-1.5 rounded-lg border text-[11px] font-sans font-semibold tracking-wide ${badge.color}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        )}

        {/* User Info & Auth Action */}
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-2.5 sm:pl-3.5">
          {user ? (
            <>
              <div className="hidden xl:block text-right font-sans">
                <div className="text-xs font-semibold text-slate-900">{user.full_name || 'Operator'}</div>
                <div className="text-[10px] text-blue-600 font-medium">{user.callsign || 'OPS-01'}</div>
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all text-xs active:scale-95 shadow-sm"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-bold transition-all shadow-sm active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
