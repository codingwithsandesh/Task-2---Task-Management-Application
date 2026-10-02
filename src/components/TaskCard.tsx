import React from 'react';
import { Calendar, MoreVertical, Pencil, Trash2, Eye, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { formatDate, getDueStatusText, getPriorityIndicator, getStatusIndicator } from '../utils/formatters';

interface TaskCardProps {
  task: Task;
  onViewDetails: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onViewDetails,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const dueInfo = getDueStatusText(task.due_date, task.status);
  const priorityInfo = getPriorityIndicator(task.priority);
  const statusInfo = getStatusIndicator(task.status);

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-150 flex flex-col justify-between">
      {/* Top Metadata Row: Zero-pill discipline with typographic separators */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{task.category || 'General'}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${priorityInfo.dotColor}`} />
              <span className={priorityInfo.textColor}>{task.priority}</span>
            </div>
          </div>

          {/* Quick status dropdown selector */}
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value as TaskStatus)}
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${statusInfo.borderColor} ${statusInfo.bgSubtle} ${statusInfo.textColor} cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500`}
            aria-label="Update task status"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {/* Task Title */}
        <h3
          onClick={() => onViewDetails(task)}
          className={`font-semibold text-base text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer leading-snug mb-1.5 ${
            task.status === 'Completed' ? 'line-through text-slate-400 dark:text-slate-500' : ''
          }`}
        >
          {task.title}
        </h3>

        {/* Task Description (truncated) */}
        {task.description && (
          <p
            onClick={() => onViewDetails(task)}
            className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 cursor-pointer leading-relaxed"
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Card Footer: Due date + Actions */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        {/* Due Date Indicator */}
        <div
          className={`flex items-center gap-1.5 font-medium ${
            dueInfo.isOverdue
              ? 'text-rose-600 dark:text-rose-400'
              : dueInfo.isToday
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
          title={task.due_date ? `Due: ${formatDate(task.due_date)}` : 'No due date set'}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{dueInfo.text}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onViewDetails(task)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="View Details"
            aria-label="View task details"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Edit Task"
            aria-label="Edit task"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(task)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Delete Task"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
