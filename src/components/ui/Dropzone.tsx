/**
 * Drag and Drop File Upload Component
 */

import React, { useState, useRef } from 'react';
import { FileUp, FilePlus2, ShieldCheck, Zap, HardDriveDownload } from 'lucide-react';
import { motion } from 'motion/react';
import emcoPdfIcon from '../../assets/images/emco_pdf_icon_1784817804482.jpg';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  compact?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, compact = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const pdfFiles = (Array.from(e.dataTransfer.files) as File[]).filter(
        f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const pdfFiles = (Array.from(e.target.files) as File[]).filter(
        f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      }
      e.target.value = ''; // Reset input
    }
  };

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer px-3 py-2 rounded-xl border border-dashed text-xs flex items-center gap-2 transition ${
          isDragOver
            ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
        }`}
      >
        <FilePlus2 className="w-4 h-4 text-blue-500" />
        <span className="font-medium">Add PDF Files</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-10 md:p-16 text-center transition-all duration-300 max-w-3xl mx-auto my-12 ${
        isDragOver
          ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/15 scale-[1.01] shadow-2xl'
          : 'border-slate-300 dark:border-slate-700 hover:border-blue-500/60 dark:hover:border-blue-400/60 glass-panel shadow-xl'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ y: isDragOver ? -8 : 0, scale: isDragOver ? 1.08 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative group"
        >
          <img
            src={emcoPdfIcon}
            alt="EMCOPDF Icon"
            className="w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-blue-500/25 border-2 border-slate-200/80 dark:border-slate-700/80 group-hover:scale-105 transition"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
            Drop PDF Files Here
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md font-medium">
            or <span className="text-blue-600 dark:text-blue-400 font-bold underline decoration-2 underline-offset-4">browse files</span> from your computer. Support for unlimited file size and unlimited pages.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-700 dark:text-slate-200 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Client-Side & Offline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Lightning Fast Web Workers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDriveDownload className="w-4 h-4 text-purple-500" />
            <span>No Server Upload Limits</span>
          </div>
        </div>
      </div>
    </div>
  );
};
