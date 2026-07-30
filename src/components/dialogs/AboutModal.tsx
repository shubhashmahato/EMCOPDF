import React from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, Code, Heart, Info, Home } from 'lucide-react';
import emcoPdfIcon from '../../assets/images/emco_pdf_icon_1784817804482.jpg';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnToHome?: () => void;
  hasPages?: boolean;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onReturnToHome,
  hasPages = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Header background decoration */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Body */}
        <div className="relative p-6 flex flex-col items-center text-center">
          {/* Logo Badge */}
          <img 
            src={emcoPdfIcon} 
            alt="EMCOPDF Icon" 
            className="w-16 h-16 rounded-2xl object-cover shadow-xl shadow-indigo-500/20 mb-3 border border-slate-200/60 dark:border-slate-700/60" 
            referrerPolicy="no-referrer"
          />

          {/* Title & Subtitle */}
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            EMCOPDF
          </h2>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            Version 1.0.0
          </p>

          <div className="w-full my-4 h-px bg-slate-200 dark:bg-slate-800" />

          {/* Main Description */}
          <div className="text-left text-xs text-slate-600 dark:text-slate-300 space-y-3.5 leading-relaxed">
            <p>
              EMCOPDF is a fast, secure, and easy-to-use PDF management tool designed to simplify everyday document tasks. Whether you're working with a single file or multiple PDFs, EMCOPDF helps you organise your documents quickly and efficiently.
            </p>

            <div>
              <p className="font-bold text-slate-900 dark:text-white mb-1.5 text-[13px]">
                Key Features:
              </p>
              <ul className="space-y-1.5 list-disc pl-4 text-[11.5px]">
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Merge PDF</strong> – Combine multiple PDF files into a single document.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Split PDF</strong> – Extract selected pages or split a PDF into separate files.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Rotate Pages</strong> – Rotate individual or multiple pages to the correct orientation.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Delete Pages</strong> – Remove unwanted pages without affecting the rest of the document.
                </li>
              </ul>
            </div>

            <p>
              Built with simplicity and performance in mind, EMCOPDF provides a smooth user experience while keeping your documents secure. It's the ideal solution for students, professionals, and businesses that need reliable PDF editing without unnecessary complexity.
            </p>
          </div>

          <div className="w-full my-4 h-px bg-slate-200 dark:bg-slate-800" />

          {/* Home Option */}
          {onReturnToHome && (
            <button
              onClick={onReturnToHome}
              className="w-full mb-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition text-xs"
              title={hasPages ? 'Return to Home and Clear Workspace' : 'Return to Home'}
            >
              <Home className="w-4 h-4" />
              <span>{hasPages ? 'Return to Home (Clear Files)' : 'Return to Home'}</span>
            </button>
          )}

          {/* Developer Credit Info */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Designed & Developed by
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              Shubhashchandra Mahato
            </span>
          </div>

          <div className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Copyright © 2026</span>
            <span>All Rights Reserved.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
