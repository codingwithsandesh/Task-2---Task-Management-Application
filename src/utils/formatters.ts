import { TaskPriority, TaskStatus } from '../types';

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No due date';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? 'Invalid date'
      : d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
  } catch {
    return 'Invalid date';
  }
}

export function isOverdue(dueDate: string | null | undefined, status: TaskStatus): boolean {
  if (!dueDate || status === 'Completed') return false;
  const today = new Date().toISOString().split('T')[0];
  const dateOnly = dueDate.split('T')[0];
  return dateOnly < today;
}

export function getDueStatusText(dueDate: string | null | undefined, status: TaskStatus): {
  text: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  if (!dueDate) {
    return { text: 'No due date', isOverdue: false, isToday: false };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const dueStr = dueDate.split('T')[0];

  if (status === 'Completed') {
    return { text: `Completed · ${formatDate(dueDate)}`, isOverdue: false, isToday: false };
  }

  const today = new Date(todayStr).getTime();
  const due = new Date(dueStr).getTime();
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      text: `Overdue by ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'}`,
      isOverdue: true,
      isToday: false,
    };
  }

  if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false, isToday: true };
  }

  if (diffDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false, isToday: false };
  }

  return { text: `Due in ${diffDays} days`, isOverdue: false, isToday: false };
}

export function getPriorityIndicator(priority: TaskPriority) {
  switch (priority) {
    case 'High':
      return {
        label: 'High Priority',
        textColor: 'text-rose-700 dark:text-rose-400',
        dotColor: 'bg-rose-500',
        borderColor: 'border-rose-200 dark:border-rose-900/50',
        bgSubtle: 'bg-rose-50 dark:bg-rose-950/30',
      };
    case 'Medium':
      return {
        label: 'Medium Priority',
        textColor: 'text-amber-700 dark:text-amber-400',
        dotColor: 'bg-amber-500',
        borderColor: 'border-amber-200 dark:border-amber-900/50',
        bgSubtle: 'bg-amber-50 dark:bg-amber-950/30',
      };
    case 'Low':
      return {
        label: 'Low Priority',
        textColor: 'text-slate-600 dark:text-slate-400',
        dotColor: 'bg-slate-400',
        borderColor: 'border-slate-200 dark:border-slate-800',
        bgSubtle: 'bg-slate-50 dark:bg-slate-900/30',
      };
  }
}

export function getStatusIndicator(status: TaskStatus) {
  switch (status) {
    case 'Completed':
      return {
        label: 'Completed',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        dotColor: 'bg-emerald-500',
        bgSubtle: 'bg-emerald-50 dark:bg-emerald-950/30',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
      };
    case 'In Progress':
      return {
        label: 'In Progress',
        textColor: 'text-sky-700 dark:text-sky-400',
        dotColor: 'bg-sky-500',
        bgSubtle: 'bg-sky-50 dark:bg-sky-950/30',
        borderColor: 'border-sky-200 dark:border-sky-800',
      };
    case 'Pending':
      return {
        label: 'Pending',
        textColor: 'text-amber-700 dark:text-amber-400',
        dotColor: 'bg-amber-500',
        bgSubtle: 'bg-amber-50 dark:bg-amber-950/30',
        borderColor: 'border-amber-200 dark:border-amber-800',
      };
  }
}
