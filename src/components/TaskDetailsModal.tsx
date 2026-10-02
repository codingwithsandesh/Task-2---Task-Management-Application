import React from 'react';
import { X, Calendar, Clock, Tag, Pencil, Trash2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { formatDate, getDueStatusText, getPriorityIndicator, getStatusIndicator } from '../utils/formatters';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  if (!isOpen || !task) return null;

  const dueInfo = getDueStatusText(task.due_date, task.status);
  const priorityInfo = getPriorityIndicator(task.priority);
  const statusInfo = getStatusIndicator(task.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${statusInfo.borderColor} ${statusInfo.bgSubtle} ${statusInfo.textColor}`}>
                {task.status}
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${priorityInfo.dotColor}`} />
                <span className={priorityInfo.textColor}>{task.priority} Priority</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {task.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-5 text-sm">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Description
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {task.description ? task.description : <span className="text-slate-400 italic">No description provided for this task.</span>}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-slate-400 dark:text-slate-500 block mb-1">Category</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {task.category || 'General'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-slate-400 dark:text-slate-500 block mb-1">Due Date</span>
              <div className="flex items-center gap-1.5">
                <span className={`font-semibold text-sm ${dueInfo.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {formatDate(task.due_date)}
                </span>
                {dueInfo.isOverdue && (
                  <span className="text-[11px] text-rose-500 font-medium">({dueInfo.text})</span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-slate-400 dark:text-slate-500 block mb-1">Created At</span>
              <span className="text-slate-700 dark:text-slate-300">
                {formatDate(task.created_at)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-slate-400 dark:text-slate-500 block mb-1">Last Updated</span>
              <span className="text-slate-700 dark:text-slate-300">
                {formatDate(task.updated_at)}
              </span>
            </div>
          </div>

          {/* Quick Status Update */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="font-medium text-xs text-slate-700 dark:text-slate-300">
              Quick Status Transition:
            </span>
            <div className="flex items-center gap-1.5">
              {(['Pending', 'In Progress', 'Completed'] as TaskStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(task, st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    task.status === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(task);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Task</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Task</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
