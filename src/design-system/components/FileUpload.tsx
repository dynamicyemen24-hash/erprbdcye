/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * UAMEX ERP™ — FileUpload Component v3.0
 * Drag-and-drop file upload with preview, progress, validation
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../utils/cn';

export interface FileUploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  preview?: string;
  error?: string;
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // bytes
  onFilesChange?: (files: FileUploadFile[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  lang?: 'ar' | 'en';
  className?: string;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  accept,
  multiple = false,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  onFilesChange,
  onUpload,
  lang = 'ar',
  className,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileUploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: FileUploadFile[] = [];

      for (const file of fileArray) {
        if (files.length + validFiles.length >= maxFiles) break;
        if (file.size > maxSize) continue;

        const uploadFile: FileUploadFile = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        };
        validFiles.push(uploadFile);
      }

      if (validFiles.length > 0) {
        const next = [...files, ...validFiles];
        setFiles(next);
        onFilesChange?.(next);
      }
    },
    [files, maxFiles, maxSize, onFilesChange]
  );

  const removeFile = useCallback(
    (id: string) => {
      const next = files.filter((f) => f.id !== id);
      setFiles(next);
      onFilesChange?.(next);
    },
    [files, onFilesChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!disabled) addFiles(e.dataTransfer.files);
    },
    [disabled, addFiles]
  );

  const handleUpload = async () => {
    if (!onUpload) return;
    const pendingFiles = files.filter((f) => f.status === 'pending').map((f) => f.file);
    if (pendingFiles.length === 0) return;

    setFiles((prev) => prev.map((f) => f.status === 'pending' ? { ...f, status: 'uploading', progress: 0 } : f));

    try {
      await onUpload(pendingFiles);
      setFiles((prev) => prev.map((f) => f.status === 'uploading' ? { ...f, status: 'success', progress: 100 } : f));
    } catch {
      setFiles((prev) => prev.map((f) => f.status === 'uploading' ? { ...f, status: 'error', error: 'Upload failed' } : f));
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all',
          isDragOver
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
            : 'border-zinc-300 dark:border-zinc-600 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {isDragOver
              ? (lang === 'ar' ? 'أفلت الملفات هنا' : 'Drop files here')
              : (lang === 'ar' ? 'اسحب الملفات هنا أو انقر للاختيار' : 'Drag files here or click to browse')
            }
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            {lang === 'ar' ? `الحد الأقصى ${maxFiles} ملفs • ${formatFileSize(maxSize)}` : `Max ${maxFiles} files • ${formatFileSize(maxSize)}`}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                f.status === 'success' && 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
                f.status === 'error' && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
                f.status === 'pending' && 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
                f.status === 'uploading' && 'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800'
              )}
            >
              {/* Preview / Icon */}
              {f.preview ? (
                <img src={f.preview} alt={f.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{f.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatFileSize(f.size)}
                  {f.status === 'uploading' && f.progress !== undefined && ` • ${f.progress}%`}
                  {f.status === 'success' && ` • ${lang === 'ar' ? 'تم الرفع' : 'Uploaded'}`}
                  {f.status === 'error' && ` • ${f.error || (lang === 'ar' ? 'فشل' : 'Failed')}`}
                </p>
                {f.status === 'uploading' && (
                  <div className="mt-1 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${f.progress || 0}%` }} />
                  </div>
                )}
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Upload button */}
          {onUpload && files.some((f) => f.status === 'pending') && (
            <button
              type="button"
              onClick={handleUpload}
              className="w-full py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {lang === 'ar' ? `رفع ${files.filter((f) => f.status === 'pending').length} ملف(s)` : `Upload ${files.filter((f) => f.status === 'pending').length} file(s)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
