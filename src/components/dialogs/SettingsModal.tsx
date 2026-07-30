/**
 * Application Settings Dialog Component
 */

import React from 'react';
import { motion } from 'motion/react';
import { X, Settings, Sun, Moon, Monitor, Sliders, Eye, Palette, Home, LayoutGrid, List, HelpCircle, Info, RotateCcw } from 'lucide-react';
import { AppSettings } from '../../types';
import emcoPdfIcon from '../../assets/images/emco_pdf_icon_1784817804482.jpg';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  theme: 'dark' | 'light' | 'system';
  onSetTheme: (theme: 'dark' | 'light' | 'system') => void;
  onReturnToHome?: () => void;
  hasPages?: boolean;
  onOpenAbout?: () => void;
  onOpenShortcuts?: () => void;
  onResetWorkspace?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  theme,
  onSetTheme,
  onReturnToHome,
  hasPages = false,
  onOpenAbout,
  onOpenShortcuts,
  onResetWorkspace,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-xs text-slate-700 dark:text-slate-200"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5 font-extrabold text-base text-slate-800 dark:text-slate-100">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Settings className="w-5 h-5" />
            </div>
            <span>Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Theme Selection */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-500" />
              <span>Appearance Theme</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onSetTheme('dark')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => onSetTheme('light')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                onClick={() => onSetTheme('system')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition ${
                  theme === 'system'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Thumbnail Size */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-500" />
              <span>Thumbnail Card Size</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ thumbnailSize: size })}
                  className={`py-2 rounded-xl border font-semibold uppercase text-center transition ${
                    settings.thumbnailSize === size
                      ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Render Quality */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>Rendering Resolution</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['fast', 'balanced', 'high'] as const).map(quality => (
                <button
                  key={quality}
                  onClick={() => onUpdateSettings({ renderQuality: quality })}
                  className={`py-2 rounded-xl border font-semibold capitalize text-center transition ${
                    settings.renderQuality === quality
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>

          {/* Workspace View Mode */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-sky-500" />
              <span>Workspace Layout</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ viewMode: 'grid' })}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition ${
                  settings.viewMode === 'grid'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ viewMode: 'list' })}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition ${
                  settings.viewMode === 'list'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
            </div>
          </div>

          {/* Display Toggles */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center justify-between cursor-pointer py-1 font-medium">
              <span>Show Page Dimensions Badge</span>
              <input
                type="checkbox"
                checked={settings.showPageDimensions}
                onChange={e => onUpdateSettings({ showPageDimensions: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer py-1 font-medium">
              <span>Show Source Document Tag</span>
              <input
                type="checkbox"
                checked={settings.showDocTags}
                onChange={e => onUpdateSettings({ showDocTags: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          {/* Quick Actions & Help */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Quick Actions & Help</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenShortcuts}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Shortcuts</span>
              </button>
              <button
                onClick={onOpenAbout}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>About App</span>
              </button>
              {hasPages && onResetWorkspace && (
                <button
                  onClick={() => {
                    onResetWorkspace();
                    onClose();
                  }}
                  className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold text-center hover:bg-rose-50 dark:hover:bg-rose-950/20 transition col-span-2 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Workspace (Restore Original Pages)</span>
                </button>
              )}
            </div>
          </div>

          {/* About Summary Box */}
          <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/70 flex flex-col items-center text-center gap-1 text-[11px]">
            <img 
              src={emcoPdfIcon} 
              alt="EMCOPDF" 
              className="w-10 h-10 rounded-xl object-cover shadow-md shadow-blue-500/20 mb-1 border border-slate-200/60 dark:border-slate-700/60" 
              referrerPolicy="no-referrer"
            />
            <span className="font-extrabold text-xs text-slate-900 dark:text-white">EMCOPDF v1.0.0</span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">Professional PDF Management Tool</span>
            <div className="my-1.5 w-full h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-slate-400 dark:text-slate-400 uppercase text-[10px] tracking-wider font-semibold">Designed & Developed by</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">Shubhashchandra Mahato</span>
            <span className="text-slate-500 dark:text-slate-400">Independent Software Developer</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Copyright © 2026. All Rights Reserved.</span>

            {onReturnToHome && (
              <>
                <div className="my-2 w-full h-px bg-slate-200 dark:bg-slate-700" />
                <button
                  onClick={() => {
                    onReturnToHome();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition"
                  title={hasPages ? "Clear loaded files and return to Home Screen" : "Return to Home Screen"}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>{hasPages ? "Return to Home (Clear Files)" : "Return to Home"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-200/60 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
