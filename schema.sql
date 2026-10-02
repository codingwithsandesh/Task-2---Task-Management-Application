-- ========================================================
-- TaskFlow Database Schema (MySQL 8.0)
-- Project: TaskFlow – Task Management Application
-- Database: task_management
-- ========================================================

CREATE DATABASE IF NOT EXISTS `task_management` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `task_management`;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `tasks`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('Pending', 'In Progress', 'Completed') NOT NULL DEFAULT 'Pending',
  `priority` ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  `category` VARCHAR(100) NOT NULL DEFAULT 'General',
  `due_date` DATE NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tasks_user_id` (`user_id`),
  INDEX `idx_tasks_status` (`status`),
  INDEX `idx_tasks_priority` (`priority`),
  INDEX `idx_tasks_due_date` (`due_date`),
  CONSTRAINT `fk_tasks_user` 
    FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Initial Seed Data (Demo purposes, passwords hashed with bcrypt)
-- Password for demo user: TaskFlow2026!
-- Hash: $2a$10$w8T06iYl3/s/yTzR04K48uGZ5uB7zN9t1b4mQeL2s5vK8xP6rM3aW
-- --------------------------------------------------------
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `password`, `created_at`, `updated_at`)
VALUES (
  'usr_demo_001',
  'Alex Turner',
  'alex.turner@taskflow.dev',
  '$2a$10$qIeqmRjKovBq174hU5gD5OW0KzV47fWd3N18mQ1iB1j5bC/7YhW9i',
  NOW(),
  NOW()
);

INSERT IGNORE INTO `tasks` (`id`, `user_id`, `title`, `description`, `status`, `priority`, `category`, `due_date`, `created_at`, `updated_at`)
VALUES 
(
  'tsk_demo_001',
  'usr_demo_001',
  'Prepare Q4 Internship Progress Presentation',
  'Summarize full-stack architecture, API benchmarks, and database schema implementation for evaluation committee.',
  'In Progress',
  'High',
  'Work',
  DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY),
  NOW(),
  NOW()
),
(
  'tsk_demo_002',
  'usr_demo_001',
  'Review MySQL Foreign Key Constraints & Indexes',
  'Ensure indexes on user_id, status, and due_date are optimized for high-volume dashboard queries.',
  'Completed',
  'Medium',
  'Development',
  DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY),
  NOW(),
  NOW()
),
(
  'tsk_demo_003',
  'usr_demo_001',
  'Draft User Guide & API Documentation',
  'Document JWT authentication workflow, request schemas, and error codes for REST endpoints.',
  'Pending',
  'Medium',
  'Documentation',
  DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY),
  NOW(),
  NOW()
),
(
  'tsk_demo_004',
  'usr_demo_001',
  'Conduct End-to-End Security Audit',
  'Verify password hashing salt rounds, JWT expiration handling, and input sanitization on all endpoints.',
  'Pending',
  'High',
  'Security',
  DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY),
  NOW(),
  NOW()
);
