import React from 'react';
import { ListTodo, Clock, PlayCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { TaskMetrics } from '../types';

interface SummaryCardsProps {
  metrics: TaskMetrics;
  activeStatusFilter: string;
  onSelectStatus: (status: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  metrics,
  activeStatusFilter,
  onSelectStatus,
}) => {
  const cards = [
    {
      id: 'All',
      label: 'Total Tasks',
      value: metrics.total,
      icon: <ListTodo className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      subtext: 'All active and completed',
      accentColor: 'border-l-indigo-600',
      activeRing: activeStatusFilter === 'All' ? 'ring-2 ring-indigo-500' : '',
    },
    {
      id: 'Pending',
      label: 'Pending',
      value: metrics.pending,
      icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      subtext: 'Awaiting action',
      accentColor: 'border-l-amber-500',
      activeRing: activeStatusFilter === 'Pending' ? 'ring-2 ring-amber-500' : '',
    },
    {
      id: 'In Progress',
      label: 'In Progress',
      value: metrics.inProgress,
      icon: <PlayCircle className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      subtext: 'Currently being worked on',
      accentColor: 'border-l-sky-500',
      activeRing: activeStatusFilter === 'In Progress' ? 'ring-2 ring-sky-500' : '',
    },
    {
      id: 'Completed',
      label: 'Completed',
      value: metrics.completed,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      subtext: 'Finished tasks',
      accentColor: 'border-l-emerald-500',
      activeRing: activeStatusFilter === 'Completed' ? 'ring-2 ring-emerald-500' : '',
    },
    {
      id: 'Overdue',
      label: 'Overdue',
      value: metrics.overdue,
      icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      subtext: 'Past due date',
      accentColor: 'border-l-rose-500',
      activeRing: activeStatusFilter === 'Overdue' ? 'ring-2 ring-rose-500' : '',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
      {cards.map((card) => {
        const isSelected = activeStatusFilter === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectStatus(isSelected ? 'All' : card.id)}
            className={`flex flex-col text-left p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-150 border-l-4 ${card.accentColor} ${card.activeRing}`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.label}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80">
                {card.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {card.value}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
              {card.subtext}
            </span>
          </button>
        );
      })}
    </div>
  );
};
