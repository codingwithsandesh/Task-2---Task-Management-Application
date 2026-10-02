import { Response } from 'express';
import { db } from '../db/database';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { wsManager } from '../utils/websocketServer';

export async function getTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { search, status, priority, category, sortBy, sortOrder } = req.query;

    const filters = {
      search: typeof search === 'string' ? search : undefined,
      status: typeof status === 'string' ? status : undefined,
      priority: typeof priority === 'string' ? priority : undefined,
      category: typeof category === 'string' ? category : undefined,
      sortBy: typeof sortBy === 'string' ? sortBy : undefined,
      sortOrder: sortOrder === 'ASC' ? ('ASC' as const) : ('DESC' as const),
    };

    // Filtered tasks for current view
    const tasks = await db.getTasksByUserId(userId, filters);

    // Compute metrics across all user's tasks
    const allUserTasks = await db.getTasksByUserId(userId);
    const todayStr = new Date().toISOString().split('T')[0];

    const metrics = {
      total: allUserTasks.length,
      pending: allUserTasks.filter((t) => t.status === 'Pending').length,
      inProgress: allUserTasks.filter((t) => t.status === 'In Progress').length,
      completed: allUserTasks.filter((t) => t.status === 'Completed').length,
      overdue: allUserTasks.filter(
        (t) => t.status !== 'Completed' && t.due_date && t.due_date < todayStr
      ).length,
    };

    res.status(200).json({
      success: true,
      data: {
        tasks,
        metrics,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks: ' + msg,
    });
  }
}

export async function getTaskById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id;

    if (!taskId) {
      res.status(400).json({
        success: false,
        message: 'Task ID is required.',
      });
      return;
    }

    const task = await db.getTaskById(taskId, userId);
    if (!task) {
      res.status(404).json({
        success: false,
        message: 'Task not found or you do not have permission to view it.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task: ' + msg,
    });
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { title, description, status, priority, category, due_date } = req.body;

    const taskId = `tsk_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    const newTask = await db.createTask({
      id: taskId,
      user_id: userId,
      title,
      description,
      status: status || 'Pending',
      priority: priority || 'Medium',
      category: category || 'General',
      due_date: due_date || null,
    });

    // Notify real-time listeners for this user
    wsManager.notifyTaskCreated(userId, newTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: newTask,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: 'Failed to create task: ' + msg,
    });
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id;

    if (!taskId) {
      res.status(400).json({
        success: false,
        message: 'Task ID is required.',
      });
      return;
    }

    const { title, description, status, priority, category, due_date } = req.body;

    const updatedTask = await db.updateTask(taskId, userId, {
      title,
      description,
      status,
      priority,
      category,
      due_date: due_date === '' ? null : due_date,
    });

    if (!updatedTask) {
      res.status(404).json({
        success: false,
        message: 'Task not found or you do not have permission to update it.',
      });
      return;
    }

    // Notify real-time listeners
    wsManager.notifyTaskUpdated(userId, updatedTask);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: updatedTask,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: 'Failed to update task: ' + msg,
    });
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id;

    if (!taskId) {
      res.status(400).json({
        success: false,
        message: 'Task ID is required.',
      });
      return;
    }

    const deleted = await db.deleteTask(taskId, userId);
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Task not found or you do not have permission to delete it.',
      });
      return;
    }

    // Notify real-time listeners
    wsManager.notifyTaskDeleted(userId, taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      message: 'Failed to delete task: ' + msg,
    });
  }
}
