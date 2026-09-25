'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar, { NavView } from '@/components/Sidebar';
import DashboardOverview from '@/components/DashboardOverview';
import TacticalMap from '@/components/TacticalMap';
import RecordList from '@/components/RecordList';
import RecordModal from '@/components/RecordModal';
import AuditLogView from '@/components/AuditLogView';
import GoogleCalendarView from '@/components/GoogleCalendarView';
import OperationalCellView from '@/components/OperationalCellView';
import TacticalGISPage from '@/components/TacticalGISPage';
import UsersManagementView from '@/components/UsersManagementView';
import AuthModal from '@/components/AuthModal';
import ExportModal from '@/components/ExportModal';
import { RecordItem, AuditLog, RecordCategory, OperationalCellType } from '@/types';
import { INITIAL_RECORDS, INITIAL_AUDIT_LOGS } from '@/lib/mockData';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { Menu, X, CheckCircle2, Lock, LogIn, Terminal, ShieldAlert, MapPin, GitBranch } from 'lucide-react';

const OPERATIONAL_CELL_IDS: OperationalCellType[] = [
  'operation_cell',
  'intelligence_cell',
  'cmo_cell',
  'personnel_cell',
  'fire_support_cell',
  'io_cell',
  'c4s_cell',
  'logistics_cell',
];

const isOperationalCell = (view: string): view is OperationalCellType => {
  return OPERATIONAL_CELL_IDS.includes(view as OperationalCellType);
};

// Standard RFC 4122 UUID generator for Supabase PostgreSQL compatibility
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function Home() {
  const router = useRouter();
  const { user, role, isAuthenticated, isLoading, canEdit, canDelete, isDemoMode } = useAuth();

  const [records, setRecords] = useState<RecordItem[]>(INITIAL_RECORDS);

  // Filter out PIAGs so Command Overview & Tactical GIS maps never display PIAG locations
  const overviewRecords = useMemo(() => {
    return records.filter((r) => {
      const isPiag =
        r.metadata?.is_piag === true ||
        r.metadata?.cmo_type === 'piag' ||
        (r.code && String(r.code).startsWith('PIAG-')) ||
        (r.title && String(r.title).startsWith('[PIAG]'));
      return !isPiag;
    });
  }, [records]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [currentView, setCurrentView] = useState<NavView>('overview');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(1);

  // Load from Supabase on mount if configured and purge any legacy KMZ local cache
  useEffect(() => {
    try {
      localStorage.removeItem('cmo_kmz_overlays');
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      loadSupabaseData();
    }
  }, []);

  // Realtime Supabase Auto-Refresh: listen for postgres_changes on public.records
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel('records-realtime-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'records' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as RecordItem;
            setRecords((prev) => {
              if (prev.some((r) => r.id === newRecord.id)) {
                return prev.map((r) => (r.id === newRecord.id ? newRecord : r));
              }
              return [newRecord, ...prev];
            });
            showToast(`Realtime Sync: New record ${newRecord.code || newRecord.title} added`);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as RecordItem;
            setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            showToast(`Realtime Sync: Record ${updated.code || updated.title} updated`);
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setRecords((prev) => prev.filter((r) => r.id !== deletedId));
            showToast('Realtime Sync: Record deleted');
          }
        }
      )
    // Refetch when the user returns to the dashboard tab instead of aggressive 10s polling
    const handleFocus = () => {
      loadSupabaseData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      supabase?.removeChannel(channel);
    };
  }, []);

  // Strict route protection: redirect to /login if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadSupabaseData = async () => {
    if (!supabase) return;
    try {
      const { data: recordsData, error: recError } = await supabase
        .from('records')
        .select('*')
        .order('created_at', { ascending: false });

      if (recordsData && !recError) {
        setRecords(recordsData as RecordItem[]);
      }

      const { data: logsData, error: logError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsData && !logError && logsData.length > 0) {
        setAuditLogs(logsData as AuditLog[]);
      }

      const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (profilesCount !== null && profilesCount !== undefined) {
        setUserCount(profilesCount);
      }
    } catch (e) {
      console.error('Error fetching Supabase records:', e);
    }
  };

  // Automated GitHub Snapshot pipeline trigger
  const triggerAutomatedSnapshot = async (
    currentData: RecordItem[],
    trigger: string,
    recordTitle?: string
  ) => {
    setIsSnapshotting(true);
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: currentData,
          trigger,
          actor: user?.email || 'system@command.local',
        }),
      });
      const resData = await res.json();

      // Log automated snapshot in audit trail
      const snapshotLog: AuditLog = {
        id: generateUUID(),
        actor_email: user?.email || 'system@command.local',
        action: 'SNAPSHOT_EXPORT',
        category: 'system',
        record_title: recordTitle ? `Auto-Snapshot (${trigger}): ${recordTitle}` : `Auto-Snapshot (${trigger})`,
        details: resData,
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [snapshotLog, ...prev]);

      return resData;
    } catch (err) {
      console.error('Snapshot trigger failed:', err);
    } finally {
      setIsSnapshotting(false);
    }
  };

  // Save / Update Record
  const handleSaveRecord = async (recordData: Partial<RecordItem>) => {
    const isEdit = Boolean(recordData.id);
    let updatedList: RecordItem[] = [];

    if (isEdit) {
      updatedList = records.map((item) =>
        item.id === recordData.id
          ? ({
              ...item,
              ...recordData,
              updated_at: new Date().toISOString(),
            } as RecordItem)
          : item
      );
      setRecords(updatedList);
      showToast(`Updated record: ${recordData.title}`);

      // Add to Audit Log
      const auditEntry: AuditLog = {
        id: generateUUID(),
        actor_email: user?.email || 'operator@command-ops.local',
        action: 'UPDATE',
        category: recordData.category,
        record_title: recordData.title,
        details: recordData,
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);

      // Supabase sync
      if (isSupabaseConfigured() && supabase && recordData.id) {
        try {
          const { error: updateError } = await supabase.from('records').update(recordData).eq('id', recordData.id);
          if (updateError) {
            console.warn('Supabase update notification:', updateError.message);
          }
          await supabase.from('audit_logs').insert(auditEntry);
        } catch (syncErr) {
          console.error('Supabase update failed:', syncErr);
        }
      }
    } else {
      const newRecordId = recordData.id || generateUUID();
      const newRecord: RecordItem = {
        id: newRecordId,
        code: recordData.code || 'REC-001',
        title: recordData.title || 'Untitled',
        category: (recordData.category as RecordCategory) || 'incidents',
        description: recordData.description || '',
        status: recordData.status || 'active',
        priority: recordData.priority || 'medium',
        lat: recordData.lat ?? 37.7749,
        lng: recordData.lng ?? -122.4194,
        location_name: recordData.location_name || '',
        metadata: recordData.metadata || {},
        created_by_email: user?.email || 'operator@command-ops.local',
        created_at: recordData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      updatedList = [newRecord, ...records];
      setRecords(updatedList);
      showToast(`Saved to Command System: ${newRecord.title}`);

      const auditEntry: AuditLog = {
        id: generateUUID(),
        actor_email: user?.email || 'operator@command-ops.local',
        action: 'CREATE',
        category: newRecord.category,
        record_title: newRecord.title,
        details: newRecord,
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [auditEntry, ...prev]);

      // Supabase sync
      if (isSupabaseConfigured() && supabase) {
        try {
          const { error: insertError } = await supabase.from('records').insert([newRecord]);
          if (insertError) {
            console.warn('Supabase insert notification:', insertError.message);
          } else {
            showToast(`Auto-saved to Supabase Cloud: ${newRecord.title}`);
          }
          await supabase.from('audit_logs').insert([auditEntry]);
        } catch (syncErr) {
          console.error('Supabase insert failed:', syncErr);
        }
      }
    }

    // Trigger Automated GitHub JSON Snapshot
    triggerAutomatedSnapshot(updatedList, isEdit ? 'RECORD_UPDATE' : 'RECORD_CREATE', recordData.title);
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (!canDelete && !isDemoMode && role !== 'operator' && role !== 'admin') {
      alert('Permission Denied: Only Administrator or Operator roles can delete records.');
      return;
    }

    const target = records.find((r) => r.id === id);
    if (!target) return;

    if (!confirm(`Are you sure you want to delete "${target.title}"?`)) {
      return;
    }

    const updatedList = records.filter((r) => r.id !== id);
    setRecords(updatedList);
    showToast(`Deleted record: ${target.title}`);

    const auditEntry: AuditLog = {
      id: generateUUID(),
      actor_email: user?.email || 'commander@command-ops.local',
      action: 'DELETE',
      category: target.category,
      record_title: target.title,
      details: { deleted_id: id, deleted_title: target.title },
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error: delError } = await supabase.from('records').delete().eq('id', id);
        if (delError) {
          console.warn('Supabase delete notification:', delError.message);
        } else {
          showToast(`Deleted from Supabase Cloud: ${target.title}`);
        }
        await supabase.from('audit_logs').insert([auditEntry]);
      } catch (delErr) {
        console.error('Supabase delete communication error:', delErr);
      }
    }

    // Trigger Automated GitHub JSON Snapshot
    triggerAutomatedSnapshot(updatedList, 'RECORD_DELETE', target.title);
  };

  // Filter records based on active category, search, and status
  const filteredRecords = records.filter((rec) => {
    const matchesCategory =
      currentView === 'overview' ||
      currentView === 'map' ||
      currentView === 'audit' ||
      currentView === 'calendar' ||
      currentView === 'users' ||
      isOperationalCell(currentView) ||
      rec.category === currentView;

    const matchesSearch =
      !searchQuery ||
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.code && rec.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.description && rec.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rec.location_name && rec.location_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || rec.status === statusFilter;

    return matchesCategory && matchesSearch && matchesStatus;
  });

  // Calculate counts for sidebar badges
  const counts: Record<string, number> = {
    audit: auditLogs.length,
    map: records.filter((r) => r.lat !== undefined && r.lng !== undefined).length,
    users: userCount,
  };
  records.forEach((r) => {
    counts[r.category] = (counts[r.category] || 0) + 1;
  });

  // 1. Loading State Screen while verifying session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center font-sans select-none">
        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-4 shadow-sm animate-pulse text-blue-600">
          <Terminal className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-sm font-bold text-slate-900 tracking-wider uppercase">
          Verifying Security Clearance...
        </div>
        <div className="text-xs text-slate-500 mt-1">Connecting to authentication gateway</div>
      </div>
    );
  }

  // 2. Strict Access Gate: Lock out unauthenticated visitors
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 text-center font-sans select-none">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Authentication required. You must log in to access the Tactical Command Center.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Proceed to Login Gateway</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSnapshot={() => setIsSnapshotModalOpen(true)}
        isSnapshotting={isSnapshotting}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <Sidebar
            currentView={currentView}
            onSelectView={setCurrentView}
            counts={counts}
            onOpenSnapshot={() => setIsSnapshotModalOpen(true)}
            isSnapshotting={isSnapshotting}
          />
        </div>

        {/* Mobile Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm">
            <div className="w-64 h-full bg-white border-r border-slate-200 shadow-xl">
              <div className="p-3.5 flex justify-between items-center border-b border-slate-200">
                <span className="font-sans text-xs font-bold text-slate-800">COMMAND MENU</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-1 text-slate-500 hover:text-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Sidebar
                currentView={currentView}
                onSelectView={(v) => {
                  setCurrentView(v);
                  setMobileSidebarOpen(false);
                }}
                counts={counts}
                onOpenSnapshot={() => {
                  setIsSnapshotModalOpen(true);
                  setMobileSidebarOpen(false);
                }}
                isSnapshotting={isSnapshotting}
              />
            </div>
          </div>
        )}

        {/* Main Content Area: Responsive across Laptop, Desktop, and Large Screen TV */}
        <main className="flex-1 p-2 overflow-y-auto w-full min-w-0 mx-auto max-w-[1920px] 3xl:max-w-[2560px] 4k:max-w-[3800px] transition-all">
          {/* Mobile View Switcher Banner */}
          <div className="md:hidden mb-4 flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center space-x-2 text-xs font-sans font-semibold text-blue-600"
            >
              <Menu className="w-4 h-4" />
              <span>NAVIGATION MENU</span>
            </button>
            <span className="text-xs font-sans text-slate-500 uppercase">{currentView}</span>
          </div>



          {/* View Routing */}
          {currentView === 'overview' && (
            <DashboardOverview
              records={records}
              auditLogs={auditLogs}
              onSelectRecord={(rec) => {
                setEditingRecord(rec);
                setIsRecordModalOpen(true);
              }}
              onNavigateCategory={(cat) => setCurrentView(cat)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onRefresh={loadSupabaseData}
            />
          )}

          {currentView === 'map' && (
            <TacticalGISPage
              records={overviewRecords}
              isSnapshotting={isSnapshotting}
              onOpenSnapshot={() => setIsSnapshotModalOpen(true)}
              onSelectRecord={(rec) => {
                setEditingRecord(rec);
                setIsRecordModalOpen(true);
              }}
              onOpenCreate={() => {
                setEditingRecord(null);
                setIsRecordModalOpen(true);
              }}
              onRefresh={loadSupabaseData}
              isSupabase={isSupabaseConfigured()}
            />
          )}

          {currentView === 'audit' && <AuditLogView logs={auditLogs} />}

          {currentView === 'calendar' && (
            <div className="space-y-4">
              <GoogleCalendarView />
            </div>
          )}

          {/* Operational Cell Pages */}
          {isOperationalCell(currentView) && (
            <OperationalCellView
              cellId={currentView}
              onSelectCell={(cell) => setCurrentView(cell)}
              records={records}
              onSelectRecord={(rec) => {
                setEditingRecord(rec);
                setIsRecordModalOpen(true);
              }}
              onOpenCreate={(defaultCat) => {
                setEditingRecord(null);
                setIsRecordModalOpen(true);
              }}
              onSaveRecord={handleSaveRecord}
              onDeleteRecord={handleDeleteRecord}
              onRefreshData={loadSupabaseData}
            />
          )}

          {/* Users & Operator Governance Page */}
          {currentView === 'users' && (
            <UsersManagementView
              currentUser={user}
              userRole={role}
              showToast={showToast}
              onLogAudit={(action, title, details) => {
                const logEntry: AuditLog = {
                  id: 'log-' + Date.now(),
                  actor_email: user?.email || 'operator@command.local',
                  action,
                  record_title: title,
                  details,
                  created_at: new Date().toISOString(),
                };
                setAuditLogs((prev) => [logEntry, ...prev]);
                if (isSupabaseConfigured() && supabase) {
                  supabase.from('audit_logs').insert(logEntry);
                }
              }}
            />
          )}

          {/* 8 CRUD Modules */}
          {currentView !== 'overview' &&
            currentView !== 'map' &&
            currentView !== 'audit' &&
            currentView !== 'calendar' &&
            currentView !== 'users' &&
            !isOperationalCell(currentView) && (
              <RecordList
                category={currentView as RecordCategory}
                records={filteredRecords}
                onOpenCreate={() => {
                  setEditingRecord(null);
                  setIsRecordModalOpen(true);
                }}
                onOpenEdit={(rec) => {
                  setEditingRecord(rec);
                  setIsRecordModalOpen(true);
                }}
                onDeleteRecord={handleDeleteRecord}
                onViewRecord={(rec) => {
                  setEditingRecord(rec);
                  setIsRecordModalOpen(true);
                }}
                onFocusOnMap={(rec) => {
                  setCurrentView('map');
                }}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
            )}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl bg-white border border-blue-200 text-blue-800 shadow-xl font-sans text-xs font-semibold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Create / Edit Modal */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveRecord}
        initialRecord={editingRecord}
        defaultCategory={
          currentView !== 'overview' &&
          currentView !== 'map' &&
          currentView !== 'audit' &&
          currentView !== 'calendar'
            ? (currentView as RecordCategory)
            : 'incidents'
        }
      />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* GitHub Snapshot Pipeline Modal */}
      <ExportModal
        isOpen={isSnapshotModalOpen}
        onClose={() => setIsSnapshotModalOpen(false)}
        records={records}
        onTriggerGitHubSnapshot={() => triggerAutomatedSnapshot(records, 'MANUAL')}
        isSnapshotting={isSnapshotting}
      />
    </div>
  );
}
