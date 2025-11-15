// Unit tests for Beads CLI wrapper

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { executeBd, getStatus, getReadyTasks, updateTask } from '../beads.js';
import { spawn } from 'child_process';

// Mock child_process
jest.mock('child_process');

describe('Beads CLI Wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeBd', () => {
    it('should execute bd command and return output', async () => {
      const mockProc = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('test output'));
            }
          }),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }),
      };

      (spawn as any).mockReturnValue(mockProc);

      const result = await executeBd(['list']);
      expect(result).toBe('test output');
      expect(spawn).toHaveBeenCalledWith(
        'bd',
        ['--no-db', 'list'],
        expect.objectContaining({ stdio: ['pipe', 'pipe', 'pipe'] })
      );
    });

    it('should reject on non-zero exit code', async () => {
      const mockProc = {
        stdout: { on: jest.fn() },
        stderr: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('error message'));
            }
          }),
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1); // Non-zero exit code
          }
        }),
      };

      (spawn as any).mockReturnValue(mockProc);

      await expect(executeBd(['invalid'])).rejects.toThrow('bd command failed');
    });

    it('should timeout after specified duration', async () => {
      const mockProc = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn(),
      };

      (spawn as any).mockReturnValue(mockProc);

      const promise = executeBd(['slow-command'], { timeout: 100 });

      // Fast-forward time
      jest.advanceTimersByTime(101);

      await expect(promise).rejects.toThrow('timed out');
      expect(mockProc.kill).toHaveBeenCalledWith('SIGTERM');
    }, 10000);
  });

  describe('getStatus', () => {
    it('should parse and return issues array', async () => {
      const mockIssues = [
        { id: 'padai-1', title: 'Test', status: 'open', priority: 0, issue_type: 'task' },
        { id: 'padai-2', title: 'Test 2', status: 'in_progress', priority: 1, issue_type: 'bug' },
      ];

      const mockProc = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from(JSON.stringify(mockIssues)));
            }
          }),
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
      };

      (spawn as any).mockReturnValue(mockProc);

      const result = await getStatus();
      expect(result).toEqual(mockIssues);
      expect(result).toHaveLength(2);
    });

    it('should return empty array on empty output', async () => {
      const mockProc = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
      };

      (spawn as any).mockReturnValue(mockProc);

      const result = await getStatus();
      expect(result).toEqual([]);
    });

    it('should throw on invalid JSON', async () => {
      const mockProc = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('invalid json {'));
            }
          }),
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
      };

      (spawn as any).mockReturnValue(mockProc);

      await expect(getStatus()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('updateTask', () => {
    it('should call bd update with correct args', async () => {
      const mockProc = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
      };

      (spawn as any).mockReturnValue(mockProc);

      await updateTask('padai-1', {
        status: 'completed',
        assignee: 'test-agent',
        notes: 'Done!',
      });

      expect(spawn).toHaveBeenCalledWith(
        'bd',
        [
          '--no-db',
          'update',
          'padai-1',
          '--status',
          'completed',
          '--assignee',
          'test-agent',
          '--notes',
          'Done!',
        ],
        expect.any(Object)
      );
    });

    it('should only include provided update fields', async () => {
      const mockProc = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
      };

      (spawn as any).mockReturnValue(mockProc);

      await updateTask('padai-2', { status: 'in_progress' });

      expect(spawn).toHaveBeenCalledWith(
        'bd',
        ['--no-db', 'update', 'padai-2', '--status', 'in_progress'],
        expect.any(Object)
      );
    });
  });
});
