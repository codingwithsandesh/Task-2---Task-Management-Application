import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, Server, HelpCircle, X, ShieldCheck } from 'lucide-react';
import { healthApi } from '../services/api';
import { DatabaseStatus } from '../types';

export const DatabaseStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchStatus() {
      const data = await healthApi.check();
      if (isMounted && data?.database) {
        setStatus(data.database);
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
        title="View Database Architecture Details"
      >
        <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="hidden sm:inline">Database:</span>
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          {status ? (status.type.includes('MySQL') ? 'MySQL 8.0' : 'SQL Store') : 'Connecting...'}
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                    Database Architecture & Integrity
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    TaskFlow Relational Database Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="font-medium text-slate-700 dark:text-slate-300">Engine Type:</span>
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  {status?.type || 'MySQL 8.0 Compatible'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="font-medium text-slate-700 dark:text-slate-300">Target Database:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  task_management
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Relational Schema & Foreign Keys:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <li><strong>users</strong> table: id, name, email (UNIQUE), password (bcrypt), timestamps</li>
                  <li><strong>tasks</strong> table: id, user_id (FK), title, description, status, priority, category, due_date</li>
                  <li>Foreign Key: <code className="font-mono">tasks.user_id → users.id (ON DELETE CASCADE)</code></li>
                </ul>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                TaskFlow maintains full relational compliance with MySQL 8.0 defined in <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">schema.sql</code>. Dynamic queries are isolated per user to guarantee zero cross-account leakage.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
