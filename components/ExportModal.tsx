'use client';

import React, { useState } from 'react';
import { RecordItem } from '@/types';
import { X, GitCommit, Download, CheckCircle2, AlertCircle, RefreshCw, Copy, ExternalLink, GitBranch, Terminal } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: RecordItem[];
  onTriggerGitHubSnapshot: () => Promise<any>;
  isSnapshotting: boolean;
}

export default function ExportModal({
  isOpen,
  onClose,
  records,
  onTriggerGitHubSnapshot,
  isSnapshotting,
}: ExportModalProps) {
  const [snapshotResult, setSnapshotResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentPayload = {
    snapshot_meta: {
      timestamp: new Date().toISOString(),
      total_records: records.length,
      generator: 'Tactical Command Dashboard Automated Pipeline',
      version: '2.5.0',
    },
    records,
  };

  const jsonString = JSON.stringify(currentPayload, null, 2);

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tactical-records-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerSnapshot = async () => {
    try {
      const res = await onTriggerGitHubSnapshot();
      setSnapshotResult(res);
    } catch (err: any) {
      setSnapshotResult({ success: false, error: err.message || 'Snapshot failed' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-2xl shadow-tactical-card overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-sm">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm sm:text-base uppercase tracking-wider text-slate-100">
                GitHub Automated JSON Snapshot Pipeline
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Captures full operational database state to GitHub repository
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto font-sans text-xs">
          {/* Status Alert if Result exists */}
          {snapshotResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start space-x-3 shadow-sm ${
                snapshotResult.success
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-800 text-rose-300'
              }`}
            >
              {snapshotResult.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm">{snapshotResult.message || 'Snapshot triggered'}</div>
                {snapshotResult.commit_sha && (
                  <div className="text-[11px] text-slate-300">
                    Commit SHA: <code className="text-cyan-300 font-bold">{snapshotResult.commit_sha.substring(0, 7)}</code>
                  </div>
                )}
                {snapshotResult.html_url && (
                  <a
                    href={snapshotResult.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-cyan-300 hover:underline pt-1 font-semibold"
                  >
                    <span>View Commit on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 shadow-inner">
            <div>
              <div className="text-slate-200 font-bold uppercase tracking-wide">Active Snapshot Target</div>
              <div className="text-[11px] text-slate-400">Path: data/records-snapshot.json ({records.length} records)</div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadJson}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-200 hover:text-white transition-all text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={handleTriggerSnapshot}
                disabled={isSnapshotting}
                className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-glow-cyan active:scale-95 text-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSnapshotting ? 'animate-spin' : ''}`} />
                <span>{isSnapshotting ? 'Committing...' : 'Commit to GitHub'}</span>
              </button>
            </div>
          </div>

          {/* JSON Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
              <span className="uppercase tracking-wider">Snapshot Payload Preview</span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Payload'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-cyan-300 max-h-60 overflow-y-auto leading-relaxed shadow-inner">
              {jsonString}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50/90">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-50 hover:bg-slate-200 text-slate-200 text-xs font-sans font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
