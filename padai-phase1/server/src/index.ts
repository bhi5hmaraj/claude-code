// PadAI Master Server
// Lightweight Express API wrapping bd CLI for multi-agent orchestration

import express from 'express';
import cors from 'cors';
import { getStatus, getReadyTasks, updateTask, getTask } from './beads.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PadAI Master Server',
    timestamp: Date.now()
  });
});

/**
 * GET /api/status
 * Returns all tasks with current status
 */
app.get('/api/status', async (req, res) => {
  try {
    const tasks = await getStatus();
    res.json({
      tasks,
      count: tasks.length,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('GET /api/status error:', error);
    res.status(500).json({
      error: 'Failed to get task status',
      message: error.message
    });
  }
});

/**
 * POST /api/claim
 * Claims the next ready task for an agent
 * Body: { agentName: string }
 */
app.post('/api/claim', async (req, res) => {
  try {
    const { agentName } = req.body;

    // Validate input
    if (!agentName || typeof agentName !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'agentName is required and must be a string'
      });
      return;
    }

    // Get ready tasks
    const readyTasks = await getReadyTasks();

    if (readyTasks.length === 0) {
      res.status(404).json({
        error: 'No tasks available',
        message: 'No ready tasks to claim'
      });
      return;
    }

    // Claim first ready task (highest priority)
    const task = readyTasks[0];

    // Update to in_progress
    await updateTask(task.id, {
      status: 'in_progress',
      assignee: agentName
    });

    // Get updated task
    const updatedTask = await getTask(task.id);

    res.json({
      task: updatedTask,
      claimed: true,
      timestamp: Date.now()
    });

    console.log(`✓ Agent "${agentName}" claimed task ${task.id}: ${task.title}`);

  } catch (error: any) {
    console.error('POST /api/claim error:', error);
    res.status(500).json({
      error: 'Failed to claim task',
      message: error.message
    });
  }
});

/**
 * POST /api/complete
 * Marks a task as completed
 * Body: { taskId: string, notes?: string }
 */
app.post('/api/complete', async (req, res) => {
  try {
    const { taskId, notes } = req.body;

    // Validate input
    if (!taskId || typeof taskId !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'taskId is required and must be a string'
      });
      return;
    }

    // Check if task exists
    const task = await getTask(taskId);
    if (!task) {
      res.status(404).json({
        error: 'Task not found',
        message: `Task ${taskId} does not exist`
      });
      return;
    }

    // Update to completed
    await updateTask(taskId, {
      status: 'completed',
      notes
    });

    res.json({
      success: true,
      taskId,
      timestamp: Date.now()
    });

    console.log(`✓ Task ${taskId} marked as completed`);

  } catch (error: any) {
    console.error('POST /api/complete error:', error);
    res.status(500).json({
      error: 'Failed to complete task',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎖️  PadAI Master Server listening on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API Status: http://localhost:${PORT}/api/status`);
});
