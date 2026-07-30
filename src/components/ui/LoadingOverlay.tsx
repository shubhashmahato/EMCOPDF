/**
 * Fullscreen or inline Loading Overlay with progress bar
 */

import React from 'react';
import { motion } from 'motion/react';
import { Loader2, FileCheck2 } from 'lucide-react';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  progress?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isOpen,
  message = 'Processing PDF...',
  progress = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-3xl glass-card text-center border border-slate-200/50 dark:border-slate-800 shadow-2xl flex flex-col items-center gap-5"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <FileCheck2 className="w-5 h-5 text-emerald-500 absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            EMCOPDF
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{message}</p>
        </div>

        {progress > 0 && (
          <div className="w-full">
            <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1.5">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
