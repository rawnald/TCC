'use client';

import React, { useMemo } from 'react';
import { UploadedDocumentFile } from '@/types/personnel';
import { getDocumentBlobUrl, openDocumentInNewTab, downloadDocument } from '@/lib/documentUtils';
import { X, Download, ExternalLink, FileText, Shield, AlertCircle } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: UploadedDocumentFile | null;
  title?: string;
  categoryLabel?: string;
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  file,
  title,
  categoryLabel,
}: DocumentViewerModalProps) {
  const blobUrl = useMemo(() => {
    if (!file) return null;
    return getDocumentBlobUrl(file);
  }, [file]);

  if (!isOpen || !file) return null;

  const isPdf = file.file_type?.toLowerCase().includes('pdf') || file.file_name?.toLowerCase().endsWith('.pdf');
  const isImage = file.file_type?.toLowerCase().includes('image') || /\.(png|jpe?g|webp|gif)$/i.test(file.file_name || '');

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-hidden animate-fadeIn font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-800">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
              {categoryLabel?.toLowerCase().includes('clearance') ? (
                <Shield className="w-5 h-5 text-blue-600" />
              ) : (
                <FileText className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-sans font-bold text-slate-900 truncate">
                  {title || file.file_name}
                </h3>
                {categoryLabel && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                    {categoryLabel}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono truncate">
                {file.file_name} {file.file_size_kb ? `• ${file.file_size_kb} KB` : ''} {file.upload_date ? `• Uploaded ${file.upload_date}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
           
            <button
              onClick={() => downloadDocument(file)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
          {blobUrl ? (
            isPdf ? (
              <iframe
                src={`${blobUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full rounded-xl bg-white border border-slate-200 shadow-sm"
                title={file.file_name}
              />
            ) : isImage ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blobUrl}
                  alt={file.file_name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md border border-slate-200"
                />
              </div>
            ) : (
              <iframe
                src={blobUrl}
                className="w-full h-full rounded-xl bg-white border border-slate-200 shadow-sm"
                title={file.file_name}
              />
            )
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Preview Unavailable</h4>
              <p className="text-xs text-slate-500 mt-1">
                The document content could not be rendered directly. You can still download the file to inspect it.
              </p>
              <button
                onClick={() => downloadDocument(file)}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
