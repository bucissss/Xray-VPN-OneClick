/**
 * Unit tests for LayoutManager service
 *
 * Tests terminal size detection and layout mode calculation
 * Feature: 005-ui-layout-expansion
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LayoutManager } from '../../../src/services/layout-manager';
import { LayoutMode } from '../../../src/types/layout';

describe('LayoutManager', () => {
  let layoutManager: LayoutManager;
  let originalStdout: typeof process.stdout;

  beforeEach(() => {
    layoutManager = new LayoutManager();
    originalStdout = process.stdout;
  });

  afterEach(() => {
    // Restore original stdout
    Object.defineProperty(process, 'stdout', {
      value: originalStdout,
      writable: true,
    });
  });

  describe('detectTerminalSize', () => {
    it('should detect terminal size in TTY mode', () => {
      // Mock TTY terminal
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
      });
      Object.defineProperty(process.stdout, 'columns', {
        value: 100,
        writable: true,
      });
      Object.defineProperty(process.stdout, 'rows', {
        value: 30,
        writable: true,
      });

      const size = layoutManager.detectTerminalSize();

      expect(size.width).toBe(100);
      expect(size.height).toBe(30);
      expect(size.isTTY).toBe(true);
    });

    it('should return default size in non-TTY mode', () => {
      // Mock non-TTY terminal
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true,
      });

      const size = layoutManager.detectTerminalSize();

      expect(size.width).toBe(80);
      expect(size.height).toBe(24);
      expect(size.isTTY).toBe(false);
    });

    it('should handle missing columns/rows gracefully', () => {
      // Mock TTY but undefined columns/rows
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
      });
      Object.defineProperty(process.stdout, 'columns', {
        value: undefined,
        writable: true,
      });
      Object.defineProperty(process.stdout, 'rows', {
        value: undefined,
        writable: true,
      });

      const size = layoutManager.detectTerminalSize();

      // Should fallback to default
      expect(size.width).toBe(80);
      expect(size.height).toBe(24);
      expect(size.isTTY).toBe(true); // Still TTY, just no size info
    });
  });

  describe('calculateLayoutMode', () => {
    it('should return COMPACT for width < 80', () => {
      expect(layoutManager.calculateLayoutMode(60)).toBe(LayoutMode.COMPACT);
      expect(layoutManager.calculateLayoutMode(79)).toBe(LayoutMode.COMPACT);
    });

    it('should return STANDARD for width 80-120', () => {
      expect(layoutManager.calculateLayoutMode(80)).toBe(LayoutMode.STANDARD);
      expect(layoutManager.calculateLayoutMode(100)).toBe(LayoutMode.STANDARD);
      expect(layoutManager.calculateLayoutMode(120)).toBe(LayoutMode.STANDARD);
    });

    it('should return WIDE for width > 120', () => {
      expect(layoutManager.calculateLayoutMode(121)).toBe(LayoutMode.WIDE);
      expect(layoutManager.calculateLayoutMode(140)).toBe(LayoutMode.WIDE);
      expect(layoutManager.calculateLayoutMode(200)).toBe(LayoutMode.WIDE);
    });

    it('should handle edge cases at boundaries', () => {
      expect(layoutManager.calculateLayoutMode(79)).toBe(LayoutMode.COMPACT);
      expect(layoutManager.calculateLayoutMode(80)).toBe(LayoutMode.STANDARD);
      expect(layoutManager.calculateLayoutMode(120)).toBe(LayoutMode.STANDARD);
      expect(layoutManager.calculateLayoutMode(121)).toBe(LayoutMode.WIDE);
    });
  });

  describe('validateTerminalSize', () => {
    it('should validate valid terminal sizes', () => {
      const result = layoutManager.validateTerminalSize({
        width: 80,
        height: 24,
        isTTY: true,
      });

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
      expect(result.suggestion).toBeUndefined();
    });

    it('should reject terminals narrower than 60 columns', () => {
      const result = layoutManager.validateTerminalSize({
        width: 50,
        height: 24,
        isTTY: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too narrow');
      expect(result.suggestion).toBeDefined();
    });

    it('should reject terminals shorter than 20 rows', () => {
      const result = layoutManager.validateTerminalSize({
        width: 80,
        height: 15,
        isTTY: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too short');
      expect(result.suggestion).toBeDefined();
    });

    it('should accept minimum valid size (60x20)', () => {
      const result = layoutManager.validateTerminalSize({
        width: 60,
        height: 20,
        isTTY: true,
      });

      expect(result.isValid).toBe(true);
    });
  });
});
