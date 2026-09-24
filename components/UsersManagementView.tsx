'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Lock,
  Edit3,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Key,
  Database,
  ExternalLink,
  UserCheck,
  UserPlus,
  X,
  Save,
  Mail,
  User,
  Radio,
  AlertCircle,
} from 'lucide-react';

interface UsersManagementViewProps {
  currentUser: UserProfile | null;
  userRole: UserRole;
  showToast: (msg: string) => void;
  onLogAudit?: (action: 'CREATE' | 'UPDATE' | 'DELETE', title: string, details: any) => void;
}

export default function UsersManagementView({
  currentUser,
  userRole,
  showToast,
  onLogAudit,
}: UsersManagementViewProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'operator' | 'viewer'>('all');

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editCallsign, setEditCallsign] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('operator');
  const [isSaving, setIsSaving] = useState(false);

  // Register Operator Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regCallsign, setRegCallsign] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('operator');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const isAdmin = userRole === 'admin';

  // Load users from Supabase profiles table
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error: fetchErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchErr) {
          setError(fetchErr.message);
        } else if (data) {
          setUsers(data as UserProfile[]);
        }
      } catch (err: any) {
        setError(err.message || 'Error communicating with Supabase');
      }
    } else {
      // Local fallback if Supabase environment is disconnected
      const fallbackList: UserProfile[] = [];
      const savedUser = localStorage.getItem('tactical_active_user');
      if (savedUser) {
        try {
          fallbackList.push(JSON.parse(savedUser));
        } catch {}
      }
      if (currentUser && !fallbackList.some((u) => u.id === currentUser.id)) {
        fallbackList.push(currentUser);
      }
      setUsers(fallbackList);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.callsign?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      operators: users.filter((u) => u.role === 'operator').length,
      viewers: users.filter((u) => u.role === 'viewer').length,
    };
  }, [users]);

  // Open Edit Dialog
  const handleOpenEdit = (target: UserProfile) => {
    const isSelf = target.id === currentUser?.id;
    if (!isAdmin && !isSelf) {
      alert('Permission Denied: Only administrators can update other users.');
      return;
    }
    setEditingUser(target);
    setEditFullName(target.full_name || '');
    setEditCallsign(target.callsign || '');
    setEditRole(target.role);
    setIsEditModalOpen(true);
  };

  // Save Edit Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const isSelf = editingUser.id === currentUser?.id;
    if (!isAdmin && !isSelf) {
      alert('Permission Denied: Only administrators can update other users.');
      return;
    }

    // Non-admins cannot elevate or change roles
    const finalRole: UserRole = isAdmin ? editRole : editingUser.role;

    setIsSaving(true);

    if (isSupabaseConfigured() && supabase) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName.trim(),
          callsign: editCallsign.trim(),
          role: finalRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (updateErr) {
        alert(`Failed to update user: ${updateErr.message}`);
        setIsSaving(false);
        return;
      }
    }

    // Update local state
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? {
              ...u,
              full_name: editFullName.trim(),
              callsign: editCallsign.trim(),
              role: finalRole,
              updated_at: new Date().toISOString(),
            }
          : u
      )
    );

    // If updating current user, sync localStorage
    if (isSelf) {
      const updatedProfile = {
        ...currentUser,
        full_name: editFullName.trim(),
        callsign: editCallsign.trim(),
        role: finalRole,
      };
      localStorage.setItem('tactical_active_user', JSON.stringify(updatedProfile));
    }

    showToast(`Updated operator profile: ${editFullName.trim()}`);
    if (onLogAudit) {
      onLogAudit('UPDATE', `User Profile Updated: ${editingUser.email}`, {
        user_id: editingUser.id,
        role: finalRole,
        callsign: editCallsign.trim(),
      });
    }

    setIsSaving(false);
    setIsEditModalOpen(false);
  };

  // Delete User (Admin Only)
  const handleDeleteUser = async (target: UserProfile) => {
    if (!isAdmin) {
      alert('Permission Denied: Only administrators can delete users.');
      return;
    }

    if (target.id === currentUser?.id) {
      alert('Action Denied: You cannot delete your own active administrator profile.');
      return;
    }

    const confirmMsg = `Are you sure you want to remove user "${target.full_name || target.email}"?\n\nThis will revoke access for ${target.email}.`;
    if (!confirm(confirmMsg)) {
      return;
    }

    if (isSupabaseConfigured() && supabase) {
      const { error: deleteErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', target.id);

      if (deleteErr) {
        alert(`Failed to delete user: ${deleteErr.message}`);
        return;
      }
    }

    setUsers((prev) => prev.filter((u) => u.id !== target.id));
    showToast(`Removed user: ${target.full_name || target.email}`);

    if (onLogAudit) {
      onLogAudit('DELETE', `User Removed: ${target.email}`, {
        deleted_user_id: target.id,
        email: target.email,
        role: target.role,
      });
    }
  };

  // Register New Operator
  const handleRegisterOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regEmail.trim() || !regPassword) {
      setRegError('Email and Password are required.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    setIsRegistering(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        '';

      if (isSupabaseConfigured() && supabaseUrl && supabaseAnonKey) {
        // Use an isolated client with persistSession: false so the active admin session is preserved
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });

        const { data, error: signUpErr } = await tempClient.auth.signUp({
          email: regEmail.trim(),
          password: regPassword,
          options: {
            data: {
              full_name: regFullName.trim(),
              callsign: regCallsign.trim() || 'OPERATOR',
              role: regRole,
            },
          },
        });

        if (signUpErr) {
          setRegError(signUpErr.message);
          setIsRegistering(false);
          return;
        }

        // Direct upsert to public.profiles using the active authenticated admin client
        if (data?.user && supabase) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: regEmail.trim(),
              full_name: regFullName.trim(),
              callsign: regCallsign.trim() || 'OPERATOR',
              role: regRole,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } catch (upsertErr) {
            console.warn('Upsert fallback warning:', upsertErr);
          }
        }

        // Refresh user list
        await fetchUsers();
      } else {
        // Fallback for local demo mode
        const mockNewUser: UserProfile = {
          id: `usr_${Date.now()}`,
          email: regEmail.trim(),
          full_name: regFullName.trim() || 'Tactical Operator',
          callsign: regCallsign.trim() || 'OPERATOR',
          role: regRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUsers((prev) => [mockNewUser, ...prev]);
      }

      if (onLogAudit) {
        onLogAudit('CREATE', `New Operator Registered: ${regEmail.trim()}`, {
          full_name: regFullName.trim(),
          callsign: regCallsign.trim(),
          role: regRole,
          registered_by: currentUser?.email || 'Admin',
        });
      }

      showToast(`Operator ${regFullName.trim() || regEmail.trim()} registered successfully`);
      setRegSuccess('Operator successfully registered and added to database.');
      setTimeout(() => {
        setIsRegisterModalOpen(false);
        setRegFullName('');
        setRegCallsign('');
        setRegEmail('');
        setRegPassword('');
        setRegRole('operator');
        setRegSuccess(null);
        setRegError(null);
      }, 700);
    } catch (err: any) {
      setRegError(err.message || 'Failed to register operator');
    } finally {
      setIsRegistering(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-slate-800 text-white border border-slate-700 shadow-sm">
            <ShieldAlert className="w-3 h-3 mr-1 text-rose-400" />
            ADMINISTRATOR
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm">
            <ShieldCheck className="w-3 h-3 mr-1 text-blue-600" />
            OPERATOR
          </span>
        );
      case 'viewer':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Eye className="w-3 h-3 mr-1 text-slate-500" />
            VIEWER
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-sm">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-xl font-sans font-bold text-slate-900 uppercase tracking-wide">
                  Users & Operator Management
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-50 border border-blue-200 text-blue-700">
                  SUPABASE AUTH
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  RLS ACTIVE
                </span>
              </div>
              <p className="text-xs font-sans text-slate-500 mt-1">
                Real-time registry of all authenticated system operators and role clearances
              </p>
            </div>
          </div>

          {/* Action Buttons: Register Operator placed next to Refresh Users in the left portion */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setRegError(null);
                setRegSuccess(null);
                setIsRegisterModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Operator</span>
            </button>

            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-sans border border-slate-200 transition-all active:scale-95 shadow-sm"
              title="Refresh users from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Users</span>
            </button>
          </div>
        </div>

        {/* Security Clearance Alert Banner */}
        <div className="mt-4 p-3 rounded-lg border text-xs font-sans flex items-start space-x-2.5">
          {isAdmin ? (
            <div className="flex items-start space-x-2 text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-md w-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase text-emerald-900">Administrator Access Granted:</span>{' '}
                <span>
                  You have full authority to register new operators, update clearance roles, modify callsigns, and delete user profiles from the Supabase database.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start space-x-2 text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-md w-full">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase text-amber-900">Restricted Operator Clearance:</span>{' '}
                <span>
                  As a <strong>{userRole.toUpperCase()}</strong>, PostgreSQL Row Level Security (RLS) protects all operator accounts. You cannot delete or update other users. You can only view the registry or modify your personal profile.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-sans text-slate-500 uppercase font-semibold">Total Registered Users</div>
          <div className="text-2xl font-sans font-bold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] font-sans text-blue-600 mt-0.5 font-medium">Profiles in Supabase</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-sans text-slate-500 uppercase font-semibold">Administrators</div>
          <div className="text-2xl font-sans font-bold text-slate-900 mt-1">{stats.admins}</div>
          <div className="text-[11px] font-sans text-slate-600 mt-0.5">Full governance rights</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-sans text-slate-500 uppercase font-semibold">Operators</div>
          <div className="text-2xl font-sans font-bold text-blue-700 mt-1">{stats.operators}</div>
          <div className="text-[11px] font-sans text-blue-600 mt-0.5 font-medium">Tactical CRUD execution</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[10px] font-sans text-slate-500 uppercase font-semibold">Viewers</div>
          <div className="text-2xl font-sans font-bold text-slate-700 mt-1">{stats.viewers}</div>
          <div className="text-[11px] font-sans text-slate-500 mt-0.5">Read-only observers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search users by name, email, or callsign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {(['all', 'admin', 'operator', 'viewer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-sans uppercase transition-all ${
                  roleFilter === r
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto pt-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs font-sans text-slate-500 flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Querying Supabase user profiles...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs font-sans text-slate-500 border border-dashed border-slate-200 rounded-lg">
              No users found matching current filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] bg-slate-50/75">
                  <th className="py-2.5 px-3 font-semibold">Operator Name</th>
                  <th className="py-2.5 px-3 font-semibold">Email Address</th>
                  <th className="py-2.5 px-3 font-semibold">Tactical Callsign</th>
                  <th className="py-2.5 px-3 font-semibold">Clearance Role</th>
                  <th className="py-2.5 px-3 font-semibold">Registered</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Actions & Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const canModifyThisUser = isAdmin || isSelf;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelf ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs shrink-0">
                            {(u.full_name || u.email).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                              <span>{u.full_name || 'Anonymous Operator'}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">ID: {u.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{u.email}</td>

                      <td className="py-3 px-3">
                        <span className="font-sans text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                          {u.callsign || 'UNASSIGNED'}
                        </span>
                      </td>

                      <td className="py-3 px-3">{getRoleBadge(u.role)}</td>

                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {canModifyThisUser ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-slate-700 text-[11px] border border-slate-200 transition-colors shadow-sm"
                                title={isSelf && !isAdmin ? 'Edit your profile' : 'Edit operator'}
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>{isSelf && !isAdmin ? 'Edit Self' : 'Edit'}</span>
                              </button>

                              {isAdmin && !isSelf && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-slate-600 text-[11px] border border-slate-200 transition-colors shadow-sm"
                                  title="Delete user profile"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </>
                          ) : (
                            /* Non-admins cannot edit or delete others */
                            <div
                              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 text-[10px] border border-slate-200 cursor-not-allowed select-none"
                              title="Locked by Row Level Security: Only Administrator can modify other users"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Locked (Admin Only)</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Register Operator Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5 font-sans">
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                    Register New Operator
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    Create credentials and assign tactical clearance role
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterOperator} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 text-[10px] uppercase mb-1 font-bold">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Marcus Vance"
                      className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-[10px] uppercase mb-1 font-bold">
                    Callsign / Code
                  </label>
                  <div className="relative">
                    <Radio className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={regCallsign}
                      onChange={(e) => setRegCallsign(e.target.value)}
                      placeholder="OVERWATCH-1"
                      className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans font-semibold text-blue-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] uppercase mb-1 font-bold">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="operator@command-ops.local"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] uppercase mb-1 font-bold">
                  Initial Password (min 6 characters) *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-[10px] uppercase mb-1 font-bold">
                  Assigned Clearance Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 text-xs focus:outline-none focus:border-blue-600 font-semibold cursor-pointer"
                >
                  <option value="operator">Operator (Add, Edit, Update Records)</option>
                  <option value="admin">Administrator (Full Access & Record Deletions)</option>
                  <option value="viewer">Viewer (Read-Only Operational Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-sans border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isRegistering ? 'Registering...' : 'Register Operator'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2 font-sans">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 text-sm uppercase">
                  {isAdmin ? 'Modify User Clearance' : 'Update Your Profile'}
                </span>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-sans text-slate-500 uppercase mb-1 font-semibold">
                  Email Address (Read-Only)
                </label>
                <input
                  type="email"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-700 uppercase mb-1 font-semibold">
                  Full Name / Operator Alias
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-700 uppercase mb-1 font-semibold">
                  Tactical Callsign
                </label>
                <input
                  type="text"
                  required
                  value={editCallsign}
                  onChange={(e) => setEditCallsign(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold text-blue-700"
                />
              </div>

              {/* Role Selection (Only Administrator can change roles) */}
              <div>
                <label className="block text-xs font-sans text-slate-700 uppercase mb-1 font-semibold">
                  Assigned Clearance Role
                </label>
                {isAdmin ? (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-sans text-slate-800 focus:outline-none focus:border-blue-600 font-semibold cursor-pointer"
                  >
                    <option value="admin">ADMINISTRATOR (Full Rights)</option>
                    <option value="operator">OPERATOR (Create/Update Records)</option>
                    <option value="viewer">VIEWER (Read-Only)</option>
                  </select>
                ) : (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-sans text-slate-600 flex items-center justify-between">
                    <span>{editingUser.role.toUpperCase()}</span>
                    <span className="text-[10px] text-amber-600 font-bold flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Role Change Requires Admin</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-sans border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-sans font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
