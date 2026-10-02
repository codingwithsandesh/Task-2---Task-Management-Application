import fs from 'fs';
import path from 'path';
import mysql, { Pool } from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface TaskRecord {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  category: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFilterOptions {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export function formatDbTimestamp(date: Date = new Date()): string {
  return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

export function createDemoSeedData() {
  const now = formatDbTimestamp();
  const demoHashedPassword = bcrypt.hashSync('TaskFlow2026!', 10);

  const demoUser: UserRecord = {
    id: 'usr_demo_001',
    name: 'Alex Turner',
    email: 'alex.turner@taskflow.dev',
    password: demoHashedPassword,
    created_at: now,
    updated_at: now,
  };

  const today = new Date();
  const formatDaysFromNow = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const demoTasks: TaskRecord[] = [
    {
      id: 'tsk_demo_001',
      user_id: 'usr_demo_001',
      title: 'Prepare Q4 Internship Progress Presentation',
      description: 'Summarize full-stack architecture, API benchmarks, and database schema implementation for evaluation committee.',
      status: 'In Progress',
      priority: 'High',
      category: 'Work',
      due_date: formatDaysFromNow(2),
      created_at: now,
      updated_at: now,
    },
    {
      id: 'tsk_demo_002',
      user_id: 'usr_demo_001',
      title: 'Review MySQL Foreign Key Constraints & Indexes',
      description: 'Ensure indexes on user_id, status, and due_date are optimized for high-volume dashboard queries.',
      status: 'Completed',
      priority: 'Medium',
      category: 'Development',
      due_date: formatDaysFromNow(-1),
      created_at: now,
      updated_at: now,
    },
    {
      id: 'tsk_demo_003',
      user_id: 'usr_demo_001',
      title: 'Draft User Guide & API Documentation',
      description: 'Document JWT authentication workflow, request schemas, and error codes for REST endpoints.',
      status: 'Pending',
      priority: 'Medium',
      category: 'Documentation',
      due_date: formatDaysFromNow(5),
      created_at: now,
      updated_at: now,
    },
    {
      id: 'tsk_demo_004',
      user_id: 'usr_demo_001',
      title: 'Conduct End-to-End Security Audit',
      description: 'Verify password hashing salt rounds, JWT expiration handling, and input sanitization on all endpoints.',
      status: 'Pending',
      priority: 'High',
      category: 'Security',
      due_date: formatDaysFromNow(1),
      created_at: now,
      updated_at: now,
    },
    {
      id: 'tsk_demo_005',
      user_id: 'usr_demo_001',
      title: 'Schedule Team Code Review Session',
      description: 'Sync with senior engineers to inspect database transaction isolation and WebSocket event broadcasting.',
      status: 'Completed',
      priority: 'Low',
      category: 'Team',
      due_date: formatDaysFromNow(-2),
      created_at: now,
      updated_at: now,
    },
  ];

  return { demoUser, demoTasks };
}

class DatabaseManager {
  private mysqlPool: Pool | null = null;
  private isUsingMySQL = false;
  private storageFilePath: string;
  private dbInfo = {
    type: 'Relational Store (MySQL 8.0 schema)',
    connected: false,
    host: 'local-store',
  };

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.storageFilePath = path.join(dataDir, 'task_management.json');
  }

  public async init(): Promise<void> {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'task_management';
    const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

    // Attempt MySQL connection with timeout
    try {
      const pool = mysql.createPool({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        port: dbPort,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 2000,
      });

      // Test connection
      const connection = await pool.getConnection();
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await connection.query(`USE \`${dbName}\`;`);

      // Create users table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_users_email (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Create tasks table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(36) NOT NULL PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          status ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
          priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
          category VARCHAR(100) NOT NULL DEFAULT 'General',
          due_date DATE NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_tasks_user_id (user_id),
          INDEX idx_tasks_status (status),
          INDEX idx_tasks_priority (priority),
          CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      connection.release();
      this.mysqlPool = pool;
      this.isUsingMySQL = true;
      await this.ensureMysqlDemoSeed();
      this.dbInfo = {
        type: 'MySQL 8.0',
        connected: true,
        host: `${dbHost}:${dbPort}/${dbName}`,
      };
      console.log(`[TaskFlow DB] Successfully connected to MySQL 8.0 database: ${dbName} at ${dbHost}:${dbPort}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.log(`[TaskFlow DB] MySQL not available (${errMsg}). Initializing file-persisted relational SQL engine...`);
      this.isUsingMySQL = false;
      this.initFileStore();
      this.dbInfo = {
        type: 'Relational Store (MySQL 8.0 schema)',
        connected: true,
        host: 'data/task_management.json',
      };
      console.log(`[TaskFlow DB] File-persisted relational database active at data/task_management.json`);
    }
  }

  public getInfo() {
    return this.dbInfo;
  }

  // --- Local Persistent Relational Store Implementation ---
  private readStore(): { users: UserRecord[]; tasks: TaskRecord[] } {
    try {
      if (!fs.existsSync(this.storageFilePath)) {
        return { users: [], tasks: [] };
      }
      const data = fs.readFileSync(this.storageFilePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return { users: [], tasks: [] };
    }
  }

  private writeStore(data: { users: UserRecord[]; tasks: TaskRecord[] }): void {
    fs.writeFileSync(this.storageFilePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private async ensureMysqlDemoSeed(): Promise<void> {
    if (!this.mysqlPool) return;

    const { demoUser, demoTasks } = createDemoSeedData();
    const [rows] = await this.mysqlPool.query(
      'SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1',
      [demoUser.email.toLowerCase()]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return;
    }

    await this.mysqlPool.query(
      'INSERT INTO users (id, name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [demoUser.id, demoUser.name, demoUser.email, demoUser.password, demoUser.created_at, demoUser.updated_at]
    );

    for (const task of demoTasks) {
      await this.mysqlPool.query(
        `INSERT INTO tasks (id, user_id, title, description, status, priority, category, due_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.user_id,
          task.title,
          task.description,
          task.status,
          task.priority,
          task.category,
          task.due_date,
          task.created_at,
          task.updated_at,
        ]
      );
    }

    console.log(`[TaskFlow DB] Seeded demo user (alex.turner@taskflow.dev / TaskFlow2026!) and ${demoTasks.length} tasks.`);
  }

  private initFileStore(): void {
    const store = this.readStore();
    const { demoUser, demoTasks } = createDemoSeedData();

    if (!store.users.some((user) => user.email.toLowerCase() === demoUser.email.toLowerCase())) {
      const combinedUsers = [...store.users, demoUser];
      const combinedTasks = [...store.tasks, ...demoTasks];
      this.writeStore({ users: combinedUsers, tasks: combinedTasks });
      console.log(`[TaskFlow DB] Seeded demo user (alex.turner@taskflow.dev / TaskFlow2026!) and ${demoTasks.length} tasks.`);
    }
  }

  // --- User Operations ---
  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (this.isUsingMySQL && this.mysqlPool) {
      const [rows] = await this.mysqlPool.query(
        'SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1',
        [cleanEmail]
      );
      const userList = rows as UserRecord[];
      return userList.length > 0 ? userList[0] : null;
    }

    const store = this.readStore();
    const user = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
    return user || null;
  }

  public async findUserById(id: string): Promise<UserRecord | null> {
    if (this.isUsingMySQL && this.mysqlPool) {
      const [rows] = await this.mysqlPool.query(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        [id]
      );
      const userList = rows as UserRecord[];
      return userList.length > 0 ? userList[0] : null;
    }

    const store = this.readStore();
    const user = store.users.find((u) => u.id === id);
    return user || null;
  }

  public async createUser(user: { id: string; name: string; email: string; password: string }): Promise<UserRecord> {
    const now = formatDbTimestamp();
    const newRecord: UserRecord = {
      id: user.id,
      name: user.name.trim(),
      email: user.email.trim().toLowerCase(),
      password: user.password,
      created_at: now,
      updated_at: now,
    };

    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query(
        'INSERT INTO users (id, name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [newRecord.id, newRecord.name, newRecord.email, newRecord.password, newRecord.created_at, newRecord.updated_at]
      );
      return newRecord;
    }

    const store = this.readStore();
    store.users.push(newRecord);
    this.writeStore(store);
    return newRecord;
  }

  // --- Task Operations with User Authorization Checks ---
  public async getTasksByUserId(userId: string, filters: TaskFilterOptions = {}): Promise<TaskRecord[]> {
    if (this.isUsingMySQL && this.mysqlPool) {
      let sql = 'SELECT * FROM tasks WHERE user_id = ?';
      const params: (string | number)[] = [userId];

      if (filters.search) {
        sql += ' AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ?)';
        const queryTerm = `%${filters.search.toLowerCase()}%`;
        params.push(queryTerm, queryTerm);
      }

      if (filters.status && filters.status !== 'All') {
        sql += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.priority && filters.priority !== 'All') {
        sql += ' AND priority = ?';
        params.push(filters.priority);
      }

      if (filters.category && filters.category !== 'All') {
        sql += ' AND category = ?';
        params.push(filters.category);
      }

      // Sorting
      const sortColumn = filters.sortBy === 'due_date' ? 'due_date'
        : filters.sortBy === 'title' ? 'title'
        : filters.sortBy === 'priority' ? 'FIELD(priority, "High", "Medium", "Low")'
        : 'created_at';

      const sortDirection = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

      if (filters.sortBy === 'priority') {
        sql += ` ORDER BY FIELD(priority, "High", "Medium", "Low") ${sortDirection}, created_at DESC`;
      } else {
        sql += ` ORDER BY ${sortColumn} ${sortDirection}`;
      }

      const [rows] = await this.mysqlPool.query(sql, params);
      return rows as TaskRecord[];
    }

    // Local Relational Store Implementation
    const store = this.readStore();
    let tasks = store.tasks.filter((t) => t.user_id === userId);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      tasks = tasks.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== 'All') {
      tasks = tasks.filter((t) => t.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'All') {
      tasks = tasks.filter((t) => t.priority === filters.priority);
    }

    if (filters.category && filters.category !== 'All') {
      tasks = tasks.filter((t) => t.category.toLowerCase() === filters.category!.toLowerCase());
    }

    // Sort
    const isAsc = filters.sortOrder === 'ASC';
    if (filters.sortBy === 'due_date') {
      tasks.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return isAsc ? a.due_date.localeCompare(b.due_date) : b.due_date.localeCompare(a.due_date);
      });
    } else if (filters.sortBy === 'priority') {
      const pWeights = { High: 3, Medium: 2, Low: 1 };
      tasks.sort((a, b) => {
        const diff = pWeights[b.priority] - pWeights[a.priority];
        return isAsc ? -diff : diff;
      });
    } else if (filters.sortBy === 'title') {
      tasks.sort((a, b) => (isAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));
    } else {
      // Default: recently created
      tasks.sort((a, b) => (isAsc ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at)));
    }

    return tasks;
  }

  public async getTaskById(taskId: string, userId: string): Promise<TaskRecord | null> {
    if (this.isUsingMySQL && this.mysqlPool) {
      const [rows] = await this.mysqlPool.query(
        'SELECT * FROM tasks WHERE id = ? AND user_id = ? LIMIT 1',
        [taskId, userId]
      );
      const taskList = rows as TaskRecord[];
      return taskList.length > 0 ? taskList[0] : null;
    }

    const store = this.readStore();
    const task = store.tasks.find((t) => t.id === taskId && t.user_id === userId);
    return task || null;
  }

  public async createTask(task: {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    priority: 'Low' | 'Medium' | 'High';
    category: string;
    due_date?: string | null;
  }): Promise<TaskRecord> {
    const now = formatDbTimestamp();
    const newRecord: TaskRecord = {
      id: task.id,
      user_id: task.user_id,
      title: task.title.trim(),
      description: task.description ? task.description.trim() : '',
      status: task.status,
      priority: task.priority,
      category: task.category.trim() || 'General',
      due_date: task.due_date || null,
      created_at: now,
      updated_at: now,
    };

    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query(
        `INSERT INTO tasks (id, user_id, title, description, status, priority, category, due_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newRecord.id,
          newRecord.user_id,
          newRecord.title,
          newRecord.description,
          newRecord.status,
          newRecord.priority,
          newRecord.category,
          newRecord.due_date,
          newRecord.created_at,
          newRecord.updated_at,
        ]
      );
      return newRecord;
    }

    const store = this.readStore();
    if (!store.tasks.some((t) => t.id === newRecord.id)) {
      store.tasks.unshift(newRecord);
      this.writeStore(store);
    }
    return newRecord;
  }

  public async updateTask(
    taskId: string,
    userId: string,
    updates: Partial<{
      title: string;
      description: string;
      status: 'Pending' | 'In Progress' | 'Completed';
      priority: 'Low' | 'Medium' | 'High';
      category: string;
      due_date: string | null;
    }>
  ): Promise<TaskRecord | null> {
    const existing = await this.getTaskById(taskId, userId);
    if (!existing) {
      return null;
    }

    const now = formatDbTimestamp();
    const updatedRecord: TaskRecord = {
      ...existing,
      title: updates.title !== undefined ? updates.title.trim() : existing.title,
      description: updates.description !== undefined ? updates.description.trim() : existing.description,
      status: updates.status || existing.status,
      priority: updates.priority || existing.priority,
      category: updates.category !== undefined ? updates.category.trim() : existing.category,
      due_date: updates.due_date !== undefined ? updates.due_date : existing.due_date,
      updated_at: now,
    };

    if (this.isUsingMySQL && this.mysqlPool) {
      await this.mysqlPool.query(
        `UPDATE tasks 
         SET title = ?, description = ?, status = ?, priority = ?, category = ?, due_date = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          updatedRecord.title,
          updatedRecord.description,
          updatedRecord.status,
          updatedRecord.priority,
          updatedRecord.category,
          updatedRecord.due_date,
          updatedRecord.updated_at,
          taskId,
          userId,
        ]
      );
      return updatedRecord;
    }

    const store = this.readStore();
    const index = store.tasks.findIndex((t) => t.id === taskId && t.user_id === userId);
    if (index !== -1) {
      store.tasks[index] = updatedRecord;
      this.writeStore(store);
      return updatedRecord;
    }

    return null;
  }

  public async deleteTask(taskId: string, userId: string): Promise<boolean> {
    const existing = await this.getTaskById(taskId, userId);
    if (!existing) {
      return false;
    }

    if (this.isUsingMySQL && this.mysqlPool) {
      const [res] = await this.mysqlPool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
      const header = res as { affectedRows?: number };
      return (header.affectedRows || 0) > 0;
    }

    const store = this.readStore();
    const initialLen = store.tasks.length;
    store.tasks = store.tasks.filter((t) => !(t.id === taskId && t.user_id === userId));
    const deleted = store.tasks.length < initialLen;
    if (deleted) {
      this.writeStore(store);
    }
    return deleted;
  }
}

export const db = new DatabaseManager();
