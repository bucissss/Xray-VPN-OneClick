/**
 * Tests for Network Utilities
 * @module tests/unit/utils/network
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import * as https from 'https';
import {
  isValidIp,
  fetchPublicIp,
  isPrivateIp,
  getNetworkInterfaces,
  detectNetwork,
} from '../../../src/utils/network';

// Mock child_process
vi.mock('child_process');

// Mock https module
vi.mock('https');

describe('Network Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidIp', () => {
    describe('IPv4 validation', () => {
      it('should validate correct IPv4 addresses', () => {
        expect(isValidIp('192.168.1.1')).toBe(true);
        expect(isValidIp('10.0.0.1')).toBe(true);
        expect(isValidIp('172.16.0.1')).toBe(true);
        expect(isValidIp('8.8.8.8')).toBe(true);
        expect(isValidIp('255.255.255.255')).toBe(true);
        expect(isValidIp('0.0.0.0')).toBe(true);
      });

      it('should reject invalid IPv4 addresses', () => {
        expect(isValidIp('256.1.1.1')).toBe(false);
        expect(isValidIp('192.168.1')).toBe(false);
        expect(isValidIp('192.168.1.1.1')).toBe(false);
        expect(isValidIp('192.168.-1.1')).toBe(false);
        expect(isValidIp('192.168.1.a')).toBe(false);
        expect(isValidIp('not-an-ip')).toBe(false);
        expect(isValidIp('')).toBe(false);
      });
    });

    describe('IPv6 validation', () => {
      it('should validate correct IPv6 addresses', () => {
        expect(isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
        expect(isValidIp('2001:db8:85a3::8a2e:370:7334')).toBe(true);
        expect(isValidIp('::1')).toBe(true);
        expect(isValidIp('::')).toBe(true);
        expect(isValidIp('fe80::1')).toBe(true);
      });

      it('should reject invalid IPv6 addresses', () => {
        expect(isValidIp('2001:0db8:85a3::8a2e:370g:7334')).toBe(false);
        expect(isValidIp('2001:0db8:85a3')).toBe(false);
      });
    });
  });

  describe('isPrivateIp', () => {
    it('should identify private IPv4 addresses', () => {
      expect(isPrivateIp('192.168.1.1')).toBe(true);
      expect(isPrivateIp('192.168.0.1')).toBe(true);
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('10.255.255.255')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('172.31.255.255')).toBe(true);
      expect(isPrivateIp('127.0.0.1')).toBe(true);
    });

    it('should identify public IPv4 addresses', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
      expect(isPrivateIp('93.184.216.34')).toBe(false);
    });
  });

  describe('fetchPublicIp', () => {
    it('should fetch public IP successfully from first service', async () => {
      const mockResponse = {
        on: vi.fn((event, handler) => {
          if (event === 'data') {
            handler('93.184.216.34');
          } else if (event === 'end') {
            handler();
          }
          return mockResponse;
        }),
      };

      const mockRequest = {
        on: vi.fn(),
      };

      vi.mocked(https.get).mockImplementation((url, callback) => {
        if (typeof callback === 'function') {
          callback(mockResponse as any);
        }
        return mockRequest as any;
      });

      const result = await fetchPublicIp(3000, 0);

      expect(result.success).toBe(true);
      expect(result.ip).toBe('93.184.216.34');
      expect(result.provider).toBe('ipify');
      expect(result.error).toBeUndefined();
    });

    it('should try next service if first fails', async () => {
      let callCount = 0;

      const mockRequest = {
        on: vi.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('Connection failed'));
          }
          return mockRequest;
        }),
      };

      const mockSuccessResponse = {
        on: vi.fn((event, handler) => {
          if (event === 'data') {
            handler('93.184.216.34');
          } else if (event === 'end') {
            handler();
          }
          return mockSuccessResponse;
        }),
      };

      vi.mocked(https.get).mockImplementation((url, callback) => {
        callCount++;
        if (callCount === 1) {
          // First service fails
          return mockRequest as any;
        } else {
          // Second service succeeds
          if (typeof callback === 'function') {
            callback(mockSuccessResponse as any);
          }
          return { on: vi.fn() } as any;
        }
      });

      const result = await fetchPublicIp(3000, 0);

      expect(result.success).toBe(true);
      expect(result.ip).toBe('93.184.216.34');
      expect(result.provider).toBe('ifconfig.me');
    });

    it('should return error when all services fail', async () => {
      const mockRequest = {
        on: vi.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('Connection failed'));
          }
          return mockRequest;
        }),
      };

      vi.mocked(https.get).mockReturnValue(mockRequest as any);

      const result = await fetchPublicIp(3000, 0);

      expect(result.success).toBe(false);
      expect(result.ip).toBe('');
      expect(result.error).toBe('All IP detection services failed after retries');
    });

    it('should reject invalid IP responses', async () => {
      const mockResponse = {
        on: vi.fn((event, handler) => {
          if (event === 'data') {
            handler('not-an-ip');
          } else if (event === 'end') {
            handler();
          }
          return mockResponse;
        }),
      };

      const mockRequest = {
        on: vi.fn((event, handler) => {
          if (event === 'error') {
            handler(new Error('Invalid IP'));
          }
          return mockRequest;
        }),
      };

      vi.mocked(https.get).mockImplementation((url, callback) => {
        if (typeof callback === 'function') {
          callback(mockResponse as any);
        }
        return mockRequest as any;
      });

      const result = await fetchPublicIp(3000, 0);

      expect(result.success).toBe(false);
    });
  });

  describe('getNetworkInterfaces', () => {
    it('should parse network interfaces correctly', () => {
      const mockOutput = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0
3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    inet 10.0.0.50/24 brd 10.0.0.255 scope global wlan0`;

      vi.mocked(execSync).mockReturnValue(mockOutput);

      const interfaces = getNetworkInterfaces();

      expect(interfaces).toHaveLength(2); // lo is filtered out
      expect(interfaces[0]).toEqual({
        name: 'eth0',
        ipv4: '192.168.1.100',
        isLoopback: false,
      });
      expect(interfaces[1]).toEqual({
        name: 'wlan0',
        ipv4: '10.0.0.50',
        isLoopback: false,
      });
    });

    it('should handle single interface', () => {
      const mockOutput = `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0`;

      vi.mocked(execSync).mockReturnValue(mockOutput);

      const interfaces = getNetworkInterfaces();

      expect(interfaces).toHaveLength(1);
      expect(interfaces[0].name).toBe('eth0');
      expect(interfaces[0].ipv4).toBe('192.168.1.100');
    });

    it('should return empty array on error', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command failed');
      });

      const interfaces = getNetworkInterfaces();

      expect(interfaces).toEqual([]);
    });

    it('should filter out loopback interfaces', () => {
      const mockOutput = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536
    inet 127.0.0.1/8 scope host lo`;

      vi.mocked(execSync).mockReturnValue(mockOutput);

      const interfaces = getNetworkInterfaces();

      expect(interfaces).toEqual([]);
    });

    it('should filter out interfaces without IPv4', () => {
      const mockOutput = `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500`;

      vi.mocked(execSync).mockReturnValue(mockOutput);

      const interfaces = getNetworkInterfaces();

      expect(interfaces).toEqual([]);
    });
  });

  describe('detectNetwork', () => {
    it('should detect network configuration with private IP', () => {
      const mockOutput = `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0`;

      vi.mocked(execSync).mockReturnValue(mockOutput);

      const config = detectNetwork();

      expect(config.interfaces).toHaveLength(1);
      expect(config.selectedIp).toBe('192.168.1.100');
      expect(config.isNat).toBe(true);
    });

    it('should detect network configuration with public IP', () => {
      const mockOutput = `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 93.184.216.34/24 brd 93.184.216.255 scope global eth0`;

      vi.mocked(execSync).mockReturnValue(mockOutput);

      const config = detectNetwork();

      expect(config.interfaces).toHaveLength(1);
      expect(config.selectedIp).toBe('93.184.216.34');
      expect(config.isNat).toBe(false);
    });

    it('should handle no interfaces', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command failed');
      });

      const config = detectNetwork();

      expect(config.interfaces).toEqual([]);
      expect(config.selectedIp).toBe('');
      expect(config.isNat).toBe(false);
    });

    it('should select first interface IP', () => {
      const mockOutput = `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0
3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 10.0.0.50/24 brd 10.0.0.255 scope global wlan0`;

      vi.mocked(execSync).mockReturnValue(mockOutput);

      const config = detectNetwork();

      expect(config.interfaces).toHaveLength(2);
      expect(config.selectedIp).toBe('192.168.1.100'); // First interface
      expect(config.isNat).toBe(true);
    });
  });
});
