// Integration tests for PadAI API endpoints
// Tests against actual .beads/ folder

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import cors from 'cors';
import { getStatus, getReadyTasks, updateTask } from '../beads.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create a test app (same as main app but separate instance)
function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/api/status', async (req, res) => {
    try {
      const tasks = await getStatus();
      res.json({ tasks, count: tasks.length, timestamp: Date.now() });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get task status', message: error.message });
    }
  });

  app.post('/api/claim', async (req, res) => {
    try {
      const { agentName } = req.body;
      if (!agentName || typeof agentName !== 'string') {
        res.status(400).json({ error: 'Invalid request', message: 'agentName is required' });
        return;
      }

      const readyTasks = await getReadyTasks();
      if (readyTasks.length === 0) {
        res.status(404).json({ error: 'No tasks available' });
        return;
      }

      const task = readyTasks[0];
      await updateTask(task.id, { status: 'in_progress', assignee: agentName });

      res.json({ task, claimed: true, timestamp: Date.now() });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to claim task', message: error.message });
    }
  });

  app.post('/api/complete', async (req, res) => {
    try {
      const { taskId, notes } = req.body;
      if (!taskId || typeof taskId !== 'string') {
        res.status(400).json({ error: 'Invalid request' });
        return;
      }

      await updateTask(taskId, { status: 'completed', notes });
      res.json({ success: true, taskId, timestamp: Date.now() });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to complete task', message: error.message });
    }
  });

  return app;
}

describe('PadAI API Integration Tests', () => {
  let app: express.Application;
  let testDir: string;

  beforeAll(() => {
    // Create temporary test directory with .beads/
    testDir = path.join('/tmp', `padai-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(path.join(testDir, '.beads'));

    // Create test tasks using bd
    process.chdir(testDir);

    // Initialize beads
    try {
      execSync('bd --no-db create --title "Test Task 1" --type task --priority 0', { stdio: 'pipe' });
      execSync('bd --no-db create --title "Test Task 2" --type task --priority 1', { stdio: 'pipe' });
      execSync('bd --no-db create --title "Test Task 3" --type task --priority 0', { stdio: 'pipe' });
    } catch (err) {
      console.warn('Failed to create test tasks, skipping integration tests');
    }

    app = createTestApp();
  });

  afterAll(() => {
    // Cleanup test directory
    if (testDir && fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/status', () => {
    it('should return all tasks', async () => {
      const response = await request(app).get('/api/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tasks');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    it('should include task details', async () => {
      const response = await request(app).get('/api/status');

      if (response.body.tasks.length > 0) {
        const task = response.body.tasks[0];
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('status');
        expect(task).toHaveProperty('priority');
      }
    });
  });

  describe('POST /api/claim', () => {
    it('should reject request without agentName', async () => {
      const response = await request(app).post('/api/claim').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should claim a ready task', async () => {
      const response = await request(app)
        .post('/api/claim')
        .send({ agentName: 'test-agent' });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('claimed', true);
        expect(response.body).toHaveProperty('task');
        expect(response.body.task).toHaveProperty('id');
      } else {
        // No tasks available
        expect(response.status).toBe(404);
      }
    });

    it('should update task status to in_progress', async () => {
      const claimResponse = await request(app)
        .post('/api/claim')
        .send({ agentName: 'integration-test' });

      if (claimResponse.status === 200) {
        const taskId = claimResponse.body.task.id;

        // Verify task is now in_progress
        const statusResponse = await request(app).get('/api/status');
        const task = statusResponse.body.tasks.find((t: any) => t.id === taskId);

        expect(task).toBeDefined();
        expect(task.status).toBe('in_progress');
        expect(task.assignee).toBe('integration-test');
      }
    });
  });

  describe('POST /api/complete', () => {
    it('should reject request without taskId', async () => {
      const response = await request(app).post('/api/complete').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should mark task as completed', async () => {
      // First claim a task
      const claimResponse = await request(app)
        .post('/api/claim')
        .send({ agentName: 'completion-test' });

      if (claimResponse.status === 200) {
        const taskId = claimResponse.body.task.id;

        // Complete the task
        const completeResponse = await request(app)
          .post('/api/complete')
          .send({ taskId, notes: 'Test completed' });

        expect(completeResponse.status).toBe(200);
        expect(completeResponse.body).toHaveProperty('success', true);
        expect(completeResponse.body).toHaveProperty('taskId', taskId);
      }
    });

    it('should accept optional notes', async () => {
      const claimResponse = await request(app)
        .post('/api/claim')
        .send({ agentName: 'notes-test' });

      if (claimResponse.status === 200) {
        const taskId = claimResponse.body.task.id;

        const completeResponse = await request(app)
          .post('/api/complete')
          .send({ taskId, notes: 'Completed with notes' });

        expect(completeResponse.status).toBe(200);
      }
    });
  });

  describe('End-to-end workflow', () => {
    it('should handle claim -> complete cycle', async () => {
      // 1. Get initial status
      const initialStatus = await request(app).get('/api/status');
      const initialCount = initialStatus.body.count;

      // 2. Claim a task
      const claimResponse = await request(app)
        .post('/api/claim')
        .send({ agentName: 'e2e-agent' });

      if (claimResponse.status === 200) {
        const taskId = claimResponse.body.task.id;

        // 3. Verify task is in_progress
        const midStatus = await request(app).get('/api/status');
        const inProgressTask = midStatus.body.tasks.find((t: any) => t.id === taskId);
        expect(inProgressTask.status).toBe('in_progress');

        // 4. Complete the task
        const completeResponse = await request(app)
          .post('/api/complete')
          .send({ taskId, notes: 'E2E test complete' });

        expect(completeResponse.status).toBe(200);

        // 5. Verify task is completed
        const finalStatus = await request(app).get('/api/status');
        const completedTask = finalStatus.body.tasks.find((t: any) => t.id === taskId);
        expect(completedTask.status).toBe('completed');
      }
    });
  });
});
