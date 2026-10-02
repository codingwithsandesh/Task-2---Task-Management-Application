import test from 'node:test';
import assert from 'node:assert/strict';

import { createDemoSeedData, formatDbTimestamp } from './database.js';

test('formatDbTimestamp converts ISO timestamps into MySQL-safe timestamps', () => {
  const value = formatDbTimestamp(new Date('2026-10-01T16:05:54.581Z'));
  assert.equal(value, '2026-10-01 16:05:54');
});

test('demo seed data includes the expected login credentials', () => {
  const { demoUser, demoTasks } = createDemoSeedData();

  assert.equal(demoUser.email, 'alex.turner@taskflow.dev');
  assert.equal(demoUser.name, 'Alex Turner');
  assert.ok(demoUser.password.length > 20);
  assert.ok(demoTasks.length >= 5);
});
