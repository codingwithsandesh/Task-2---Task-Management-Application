import React from 'react';
import { ArrowLeft, ArrowRight, Clock, PlayCircle, CheckCircle2, Plus } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onViewDetails: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onOpenCreateWithStatus: (status: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onViewDetails,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenCreateWithStatus,
}) => {
  const columns: {
    status: TaskStatus;
    title: string;
    icon: React.ReactNode;
    color: string;
    borderAccent: string;
  }[] = [
    {
      status: 'Pending',
      title: 'Pending',
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      borderAccent: 'border-t-amber-500',
    },
    {
      status: 'In Progress',
      title: 'In Progress',
      icon: <PlayCircle className="w-4 h-4 text-sky-500" />,
      color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      borderAccent: 'border-t-sky-500',
    },
    {
      status: 'Completed',
      title: 'Completed',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      borderAccent: 'border-t-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
      {columns.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            className={`flex flex-col bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 border-t-4 ${col.borderAccent} min-h-[450px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                {col.icon}
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                  {col.title}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {columnTasks.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenCreateWithStatus(col.status)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-white dark:hover:bg-slate-800 transition-colors"
                title={`Add task in ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards in Column */}
            <div className="flex flex-col gap-3 flex-1">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex-1 bg-white/40 dark:bg-slate-900/30">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    No {col.title.toLowerCase()} tasks
                  </p>
                  <button
                    onClick={() => onOpenCreateWithStatus(col.status)}
                    className="mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    + Add Task
                  </button>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div key={task.id} className="relative group">
                    <TaskCard
                      task={task}
                      onViewDetails={onViewDetails}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                    />

                    {/* Quick Move Lateral Buttons */}
                    <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] text-slate-400">
                      {col.status !== 'Pending' ? (
                        <button
                          onClick={() => {
                            const prevStatus = col.status === 'Completed' ? 'In Progress' : 'Pending';
                            onStatusChange(task, prevStatus);
                          }}
                          className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Move left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Move back</span>
                        </button>
                      ) : <span />}

                      {col.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            const nextStatus = col.status === 'Pending' ? 'In Progress' : 'Completed';
                            onStatusChange(task, nextStatus);
                          }}
                          className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 ml-auto"
                          title="Move right"
                        >
                          <span>Move forward</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
