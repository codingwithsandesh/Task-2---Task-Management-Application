import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksApi } from '../services/api';
import { wsService } from '../services/websocket';
import { FilterOptions, Task, TaskMetrics, TaskPriority, TaskStatus, ToastMessage } from '../types';
import { Navbar } from '../components/Navbar';
import { SummaryCards } from '../components/SummaryCards';
import { FilterBar } from '../components/FilterBar';
import { TaskCard } from '../components/TaskCard';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskModal } from '../components/TaskModal';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ToastContainer } from '../components/Toast';
import { Plus, ListTodo, AlertCircle, RefreshCw } from 'lucide-react';

const DEFAULT_METRICS: TaskMetrics = {
  total: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
  overdue: 0,
};

const DEFAULT_FILTERS: FilterOptions = {
  search: '',
  status: 'All',
  priority: 'All',
  category: 'All',
  sortBy: 'created_at',
  sortOrder: 'DESC',
};

function deduplicateTasks(taskList: Task[]): Task[] {
  const map = new Map<string, Task>();
  for (const t of taskList) {
    if (t && t.id) {
      map.set(t.id, t);
    }
  }
  return Array.from(map.values());
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<TaskMetrics>(DEFAULT_METRICS);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>('Pending');
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // WebSocket connection status
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await tasksApi.getTasks(filters);
      setTasks(deduplicateTasks(data.tasks));
      setMetrics(data.metrics);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch tasks.';
      setError(msg);
      addToast('error', msg);
    } finally {
      setIsLoading(false);
    }
  }, [filters, addToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Hook up WebSocket real-time updates
  useEffect(() => {
    wsService.setListeners({
      onStatusChange: (status) => {
        setWsStatus(status);
      },
      onTaskCreated: (createdTask) => {
        setTasks((prev) => {
          if (prev.some((t) => t.id === createdTask.id)) return prev;
          return deduplicateTasks([createdTask, ...prev]);
        });
        // refresh full metrics accurately
        fetchTasks();
      },
      onTaskUpdated: (updatedTask) => {
        setTasks((prev) =>
          deduplicateTasks(
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
          )
        );
        if (detailsTask && detailsTask.id === updatedTask.id) {
          setDetailsTask(updatedTask);
        }
        fetchTasks();
      },
      onTaskDeleted: ({ id }) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (detailsTask && detailsTask.id === id) {
          setDetailsTask(null);
        }
        fetchTasks();
      },
    });

    wsService.connect();

    return () => {
      // do not disconnect on filter changes
    };
  }, [fetchTasks, detailsTask]);

  // Guaranteed unique tasks for display and views
  const displayTasks = useMemo(() => deduplicateTasks(tasks), [tasks]);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const defaultCategories = ['Work', 'Personal', 'Development', 'Documentation', 'Security', 'Design'];
    const custom = displayTasks.map((t) => t.category).filter(Boolean);
    return Array.from(new Set([...defaultCategories, ...custom]));
  }, [displayTasks]);

  // CRUD Operations Handlers
  const handleCreateOrUpdateTask = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    category: string;
    due_date: string | null;
  }) => {
    if (editingTask) {
      // Update
      const updated = await tasksApi.updateTask(editingTask.id, taskData);
      setTasks((prev) =>
        deduplicateTasks(prev.map((t) => (t.id === updated.id ? updated : t)))
      );
      addToast('success', `Task "${updated.title}" updated successfully.`);
      if (detailsTask && detailsTask.id === updated.id) {
        setDetailsTask(updated);
      }
    } else {
      // Create
      const created = await tasksApi.createTask(taskData);
      setTasks((prev) => {
        if (prev.some((t) => t.id === created.id)) return prev;
        return deduplicateTasks([created, ...prev]);
      });
      addToast('success', `Task "${created.title}" created successfully.`);
    }
    await fetchTasks();
  };

  const handleQuickStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;
    try {
      const updated = await tasksApi.updateTask(task.id, { status: newStatus });
      setTasks((prev) =>
        deduplicateTasks(prev.map((t) => (t.id === updated.id ? updated : t)))
      );
      if (detailsTask && detailsTask.id === updated.id) {
        setDetailsTask(updated);
      }
      addToast('info', `Status changed to ${newStatus}`);
      await fetchTasks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status.';
      addToast('error', msg);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    try {
      await tasksApi.deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      if (detailsTask && detailsTask.id === task.id) {
        setDetailsTask(null);
      }
      addToast('success', `Task "${task.title}" deleted.`);
      await fetchTasks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task.';
      addToast('error', msg);
      throw err;
    }
  };

  const openCreateModal = (status: TaskStatus = 'Pending') => {
    setEditingTask(null);
    setDefaultTaskStatus(status);
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header Navigation */}
      <Navbar
        wsStatus={wsStatus}
        onNewTaskClick={() => openCreateModal('Pending')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user?.name || 'Intern'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Track your deliverables, monitor deadlines, and keep projects moving forward.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => fetchTasks()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
              title="Refresh tasks from database"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => openCreateModal('Pending')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Summary Metrics Cards */}
        <SummaryCards
          metrics={metrics}
          activeStatusFilter={filters.status}
          onSelectStatus={(status) => setFilters((prev) => ({ ...prev, status }))}
        />

        {/* Filter & Controls Bar */}
        <FilterBar
          filters={filters}
          categories={categories}
          viewMode={viewMode}
          onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
          onResetFilters={() => setFilters(DEFAULT_FILTERS)}
          onViewModeChange={(mode) => setViewMode(mode)}
          onOpenCreateModal={() => openCreateModal('Pending')}
        />

        {/* Content View: List or Kanban */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-36 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-700"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">
              Failed to load tasks
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => fetchTasks()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <ListTodo className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No tasks found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {filters.search || filters.status !== 'All' || filters.priority !== 'All'
                ? 'No tasks match your current filter criteria. Try resetting your search or filter filters.'
                : 'Get started by creating your first task to organize your daily deliverables.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2.5">
              {filters.search || filters.status !== 'All' || filters.priority !== 'All' ? (
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              ) : null}
              <button
                onClick={() => openCreateModal('Pending')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={displayTasks}
            onViewDetails={(t) => setDetailsTask(t)}
            onEdit={openEditModal}
            onDelete={(t) => setDeletingTask(t)}
            onStatusChange={handleQuickStatusChange}
            onOpenCreateWithStatus={(st) => openCreateModal(st)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onViewDetails={(t) => setDetailsTask(t)}
                onEdit={openEditModal}
                onDelete={(t) => setDeletingTask(t)}
                onStatusChange={handleQuickStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-4 bg-white/50 dark:bg-slate-900/50 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TaskFlow – "Organize. Track. Complete." · Internship Task 2</span>
          <span>Full-Stack REST API · MySQL 8.0 / SQL · JWT & bcrypt</span>
        </div>
      </footer>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        initialData={editingTask}
        defaultStatus={defaultTaskStatus}
        categories={categories}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        task={detailsTask}
        isOpen={!!detailsTask}
        onClose={() => setDetailsTask(null)}
        onEdit={(t) => {
          setDetailsTask(null);
          openEditModal(t);
        }}
        onDelete={(t) => {
          setDetailsTask(null);
          setDeletingTask(t);
        }}
        onStatusChange={handleQuickStatusChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        task={deletingTask}
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteTask}
      />
    </div>
  );
};
