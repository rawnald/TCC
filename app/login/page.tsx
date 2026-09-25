'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import {
  Terminal,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Database,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await signIn(email, password);
      if (res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
      } else {
        setSuccessMsg('Session authenticated. Access granted.');
        setTimeout(() => router.push('/'), 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center items-center p-4 relative font-sans select-none">
      {/* Top Banner Branding */}
      <div className="absolute top-6 left-6 flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm border border-blue-500 group-hover:scale-105 transition-transform text-white">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-sans font-bold tracking-wider text-sm sm:text-base text-slate-900 uppercase">
              Tactical Command Center
            </div>
            <div className="text-[10px] text-blue-600 font-sans flex items-center space-x-1.5 font-semibold">
              
              <span>JOINT TASK FORCE CENTRAL</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden mt-14 mb-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 shadow-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-sm uppercase tracking-wider text-slate-900">
                Operator Sign-In
              </h1>
              <p className="text-[10px] text-slate-500 font-sans">
                SECURE POSTGRESQL AUTH (RLS)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] font-sans px-2 py-0.5 rounded-full border uppercase font-bold bg-blue-50 text-blue-700 border-blue-200 shadow-sm">
              Encrypted Session
            </span>
          </div>
        </div>

        {/* Active Session Info if Logged In */}
        {user && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between text-[11px] font-sans shadow-sm">
            <div className="text-slate-800">
              Active: <span className="text-blue-700 font-bold">{user.full_name}</span> ({user.role})
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-bold underline">
              Open Dashboard &rarr;
            </Link>
          </div>
        )}

        {/* Form Body */}
        <div className="px-6 py-5 space-y-4 font-sans text-xs">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-700 text-[10px] uppercase mb-1 font-bold">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@command-ops.local"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 text-[10px] uppercase font-bold">Password *</label>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-9 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Command'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] font-sans text-slate-500">
          <Link href="/" className="text-blue-600 hover:text-blue-700 inline-flex items-center space-x-1 font-semibold">
            <span>&larr; Return to Central Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Security Note */}
      <div className="max-w-md w-full p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-sans mb-4 flex items-center space-x-2 shadow-sm">
        <ShieldAlert className="w-4 h-4 shrink-0 text-blue-600" />
        <div>
          <strong>Authorized Personnel Only:</strong> All access attempts and operational commands are monitored and logged to the security ledger.
        </div>
      </div>

      {/* Security Disclaimer Note */}
      <div className="max-w-md text-center text-[11px] font-sans text-slate-500 space-y-1">
        <div className="flex items-center justify-center space-x-1.5 font-semibold text-slate-700">
          <Database className="w-3 h-3 text-blue-600" />
          <span>PostgreSQL Row Level Security (RLS) Enforced</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Operator registration is restricted to system administrators in the Command Portal.
        </p>
      </div>
    </div>
  );
}
