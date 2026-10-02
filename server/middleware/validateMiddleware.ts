import { Request, Response, NextFunction } from 'express';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req: Request, res: Response, next: NextFunction): void {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    res.status(400).json({
      success: false,
      message: 'Full Name is required and must be at least 2 characters long.',
    });
    return;
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({
      success: false,
      message: 'Password is required and must be at least 6 characters long.',
    });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({
      success: false,
      message: 'Passwords do not match. Please verify your confirm password.',
    });
    return;
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    });
    return;
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    res.status(400).json({
      success: false,
      message: 'Password is required.',
    });
    return;
  }

  next();
}

export function validateTaskPayload(req: Request, res: Response, next: NextFunction): void {
  const { title, status, priority, category, due_date } = req.body;

  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Task title is required and must be at least 2 characters.',
      });
      return;
    }
  } else if (req.method === 'PUT') {
    if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
      res.status(400).json({
        success: false,
        message: 'Task title must be at least 2 characters.',
      });
      return;
    }
  }

  if (status !== undefined && !['Pending', 'In Progress', 'Completed'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Status must be one of: Pending, In Progress, Completed.',
    });
    return;
  }

  if (priority !== undefined && !['Low', 'Medium', 'High'].includes(priority)) {
    res.status(400).json({
      success: false,
      message: 'Priority must be one of: Low, Medium, High.',
    });
    return;
  }

  if (category !== undefined && typeof category !== 'string') {
    res.status(400).json({
      success: false,
      message: 'Category must be a valid text string.',
    });
    return;
  }

  if (due_date && typeof due_date === 'string' && due_date.trim() !== '') {
    const timestamp = Date.parse(due_date);
    if (isNaN(timestamp)) {
      res.status(400).json({
        success: false,
        message: 'Invalid due date format. Please use YYYY-MM-DD.',
      });
      return;
    }
  }

  next();
}
