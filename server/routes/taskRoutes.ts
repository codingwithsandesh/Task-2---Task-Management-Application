import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateTaskPayload } from '../middleware/validateMiddleware';

const router = Router();

// All task routes require authentication
router.use(authenticateToken);

// GET /api/tasks - Retrieve tasks belonging to logged-in user with filters & sorting
router.get('/', getTasks);

// GET /api/tasks/:id - Retrieve specific task with authorization check
router.get('/:id', getTaskById);

// POST /api/tasks - Create task for logged-in user
router.post('/', validateTaskPayload, createTask);

// PUT /api/tasks/:id - Update task belonging to logged-in user
router.put('/:id', validateTaskPayload, updateTask);

// DELETE /api/tasks/:id - Delete task belonging to logged-in user
router.delete('/:id', deleteTask);

export default router;
