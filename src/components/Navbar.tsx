import React from 'react';
import { CheckSquare, LogOut, User as UserIcon, Radio, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DatabaseStatusBadge } from './DatabaseStatusBadge';

interface NavbarProps {
  wsStatus: 'connected' | 'connecting' | 'disconnected';
  onNewTaskClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ wsStatus, onNewTaskClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  TaskFlow
                </span>
                <span className="hidden md:inline-flex items-center text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Internship Project
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
                Organize. Track. Complete.
              </p>
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Database indicator */}
            <DatabaseStatusBadge />

            {/* Real-time WS status indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800"
              title={
                wsStatus === 'connected'
                  ? 'Real-time WebSocket Live Sync Active'
                  : wsStatus === 'connecting'
                  ? 'WebSocket Connecting...'
                  : 'WebSocket Disconnected (Polling REST)'
              }
            >
              {wsStatus === 'connected' ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden sm:inline font-medium">Live</span>
                </>
              ) : wsStatus === 'connecting' ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="hidden sm:inline font-medium">Syncing</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline text-slate-400">REST</span>
                </>
              )}
            </div>

            {/* User welcome & avatar */}
            {user && (
              <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                    {user.email}
                  </div>
                </div>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              title="Log out of TaskFlow"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
