/**
 * Tests for UserMetadataManager Service
 * @module tests/unit/services/user-metadata-manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserMetadataManager } from '../../../src/services/user-metadata-manager';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

// Mock modules
vi.mock('fs');
vi.mock('fs/promises');

describe('UserMetadataManager', () => {
  const testMetadataPath = '/tmp/test-user-metadata.json';
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const anotherUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  let manager: UserMetadataManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new UserMetadataManager(testMetadataPath);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create manager with custom path', () => {
      const customManager = new UserMetadataManager('/custom/path.json');
      expect(customManager).toBeInstanceOf(UserMetadataManager);
    });

    it('should create manager with default path', () => {
      const defaultManager = new UserMetadataManager();
      expect(defaultManager).toBeInstanceOf(UserMetadataManager);
    });
  });

  describe('getMetadata', () => {
    it('should return null if user not found', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const metadata = await manager.getMetadata(validUserId);

      expect(metadata).toBeNull();
    });

    it('should return user metadata if found', async () => {
      const mockStore = {
        users: {
          [validUserId]: {
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const,
            statusChangedAt: '2024-01-01T00:00:00.000Z',
          },
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const metadata = await manager.getMetadata(validUserId);

      expect(metadata).toEqual(mockStore.users[validUserId]);
    });

    it('should use cache on subsequent calls', async () => {
      const mockStore = {
        users: {
          [validUserId]: {
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const,
          },
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(mockStore));

      await manager.getMetadata(validUserId);
      await manager.getMetadata(validUserId);

      // Should only read file once due to caching
      expect(fsPromises.readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('setMetadata', () => {
    it('should create new user metadata', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await manager.setMetadata(validUserId, { status: 'active' });

      expect(fsPromises.writeFile).toHaveBeenCalled();
      const writeCall = vi.mocked(fsPromises.writeFile).mock.calls[0];
      const savedStore = JSON.parse(writeCall[1] as string);
      expect(savedStore.users[validUserId]).toBeDefined();
      expect(savedStore.users[validUserId].status).toBe('active');
    });

    it('should update existing user metadata', async () => {
      const mockStore = {
        users: {
          [validUserId]: {
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const,
          },
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(mockStore));
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await manager.setMetadata(validUserId, { status: 'suspended' });

      const writeCall = vi.mocked(fsPromises.writeFile).mock.calls[0];
      const savedStore = JSON.parse(writeCall[1] as string);
      expect(savedStore.users[validUserId].status).toBe('suspended');
      expect(savedStore.users[validUserId].createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should throw error for invalid UUID', async () => {
      await expect(manager.setMetadata('invalid-uuid', { status: 'active' })).rejects.toThrow(
        'Invalid UUID format'
      );
    });

    it('should create directory if it does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(false).mockReturnValueOnce(false);
      vi.mocked(fsPromises.mkdir).mockResolvedValue(undefined);
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await manager.setMetadata(validUserId, { status: 'active' });

      expect(fsPromises.mkdir).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create new user with default metadata', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      const metadata = await manager.createUser(validUserId);

      expect(metadata.status).toBe('active');
      expect(metadata.createdAt).toBeDefined();
      expect(metadata.statusChangedAt).toBeDefined();
    });

    it('should not overwrite existing user', async () => {
      const existingMetadata = {
        createdAt: '2024-01-01T00:00:00.000Z',
        status: 'suspended' as const,
        statusChangedAt: '2024-01-01T00:00:00.000Z',
      };

      const mockStore = {
        users: {
          [validUserId]: existingMetadata,
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const metadata = await manager.createUser(validUserId);

      expect(metadata).toEqual(existingMetadata);
      expect(fsPromises.writeFile).not.toHaveBeenCalled();
    });

    it('should throw error for invalid UUID', async () => {
      await expect(manager.createUser('invalid-uuid')).rejects.toThrow('Invalid UUID format');
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      const mockStore = {
        users: {
          [validUserId]: {
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const,
          },
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(mockStore));
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await manager.updateStatus(validUserId, 'suspended');

      const writeCall = vi.mocked(fsPromises.writeFile).mock.calls[0];
      const savedStore = JSON.parse(writeCall[1] as string);
      expect(savedStore.users[validUserId].status).toBe('suspended');
      expect(savedStore.users[validUserId].statusChangedAt).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(manager.updateStatus(validUserId, 'suspended')).rejects.toThrow(
        'User metadata not found'
      );
    });
  });

  describe('deleteMetadata', () => {
    it('should delete user metadata', async () => {
      const mockStore = {
        users: {
          [validUserId]: {
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const,
          },
          [anotherUserId]: {
            createdAt: '2024-01-02T00:00:00.000Z',
            status: 'active' as const,
          },
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(mockStore));
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);

      await manager.deleteMetadata(validUserId);

      const writeCall = vi.mocked(fsPromises.writeFile).mock.calls[0];
      const savedStore = JSON.parse(writeCall[1] as string);
      expect(savedStore.users[validUserId]).toBeUndefined();
      expect(savedStore.users[anotherUserId]).toBeDefined();
    });

    it('should do nothing if user not found', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await manager.deleteMetadata(validUserId);

      expect(fsPromises.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('getAllMetadata', () => {
    it('should return all user metadata', async () => {
      const mockStore = {
        users: {
          [validUserId]: {
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const,
          },
          [anotherUserId]: {
            createdAt: '2024-01-02T00:00:00.000Z',
            status: 'suspended' as const,
          },
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const allMetadata = await manager.getAllMetadata();

      expect(Object.keys(allMetadata)).toHaveLength(2);
      expect(allMetadata[validUserId]).toEqual(mockStore.users[validUserId]);
      expect(allMetadata[anotherUserId]).toEqual(mockStore.users[anotherUserId]);
    });

    it('should return empty object if no users', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const allMetadata = await manager.getAllMetadata();

      expect(allMetadata).toEqual({});
    });
  });

  describe('getUsersByStatus', () => {
    it('should return users with specific status', async () => {
      const mockStore = {
        users: {
          [validUserId]: {
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const,
          },
          [anotherUserId]: {
            createdAt: '2024-01-02T00:00:00.000Z',
            status: 'suspended' as const,
          },
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const activeUsers = await manager.getUsersByStatus('active');

      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0][0]).toBe(validUserId);
      expect(activeUsers[0][1].status).toBe('active');
    });

    it('should return empty array if no users with status', async () => {
      const mockStore = {
        users: {
          [validUserId]: {
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const,
          },
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue(JSON.stringify(mockStore));

      const suspendedUsers = await manager.getUsersByStatus('suspended');

      expect(suspendedUsers).toHaveLength(0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache and reload from file', async () => {
      const mockStore1 = {
        users: {
          [validUserId]: {
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'active' as const,
          },
        },
      };

      const mockStore2 = {
        users: {
          [validUserId]: {
            createdAt: '2024-01-01T00:00:00.000Z',
            status: 'suspended' as const,
          },
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile)
        .mockResolvedValueOnce(JSON.stringify(mockStore1))
        .mockResolvedValueOnce(JSON.stringify(mockStore2));

      // First call - loads from file
      const metadata1 = await manager.getMetadata(validUserId);
      expect(metadata1?.status).toBe('active');

      // Clear cache
      manager.clearCache();

      // Second call - should reload from file
      const metadata2 = await manager.getMetadata(validUserId);
      expect(metadata2?.status).toBe('suspended');

      expect(fsPromises.readFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockRejectedValue(new Error('Read error'));

      const metadata = await manager.getMetadata(validUserId);

      expect(metadata).toBeNull();
    });

    it('should handle JSON parse errors gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fsPromises.readFile).mockResolvedValue('invalid json');

      const metadata = await manager.getMetadata(validUserId);

      expect(metadata).toBeNull();
    });
  });
});
