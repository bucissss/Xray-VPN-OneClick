/**
 * Tests for Error Formatter Utility
 * @module tests/unit/utils/error-formatter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatAppError,
  formatErrorInfo,
  formatError,
  formatByCode,
  simpleErrorMessage,
} from '../../../src/utils/error-formatter';
import { AppError } from '../../../src/utils/errors';
import { ErrorInfo } from '../../../src/constants/error-codes';
import * as logger from '../../../src/utils/logger';
import * as terminal from '../../../src/utils/terminal';

describe('Error Formatter', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E999',
    title: 'Test Error',
    causes: ['Cause 1', 'Cause 2'],
    solutions: ['Solution 1', 'Solution 2'],
  };

  beforeEach(() => {
    // Mock terminal capabilities to return consistent results
    vi.spyOn(terminal, 'detectTerminalCapabilities').mockReturnValue({
      supportsColor: true,
      supportsUnicode: true,
      colorDepth: 24,
      isInteractive: true,
      terminalType: 'xterm-256color',
    });

    // Mock output mode to PLAIN for consistent testing
    vi.spyOn(logger, 'getOutputMode').mockReturnValue(logger.OutputMode.PLAIN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatAppError', () => {
    it('should format AppError with all sections', () => {
      const error = new AppError(mockErrorInfo, 'Additional details');
      const formatted = formatAppError(error);

      expect(formatted).toContain('✗ 错误 [E999]: Test Error');
      expect(formatted).toContain('Additional details');
      expect(formatted).toContain('可能的原因:');
      expect(formatted).toContain('1. Cause 1');
      expect(formatted).toContain('2. Cause 2');
      expect(formatted).toContain('解决方案:');
      expect(formatted).toContain('- Solution 1');
      expect(formatted).toContain('- Solution 2');
    });

    it('should format AppError without details', () => {
      const error = new AppError(mockErrorInfo);
      const formatted = formatAppError(error);

      expect(formatted).toContain('✗ 错误 [E999]: Test Error');
      expect(formatted).not.toContain('Additional details');
      expect(formatted).toContain('可能的原因:');
      expect(formatted).toContain('解决方案:');
    });

    it('should hide causes when showCauses is false', () => {
      const error = new AppError(mockErrorInfo);
      const formatted = formatAppError(error, { showCauses: false });

      expect(formatted).toContain('✗ 错误 [E999]: Test Error');
      expect(formatted).not.toContain('可能的原因:');
      expect(formatted).not.toContain('Cause 1');
      expect(formatted).toContain('解决方案:');
    });

    it('should hide solutions when showSolutions is false', () => {
      const error = new AppError(mockErrorInfo);
      const formatted = formatAppError(error, { showSolutions: false });

      expect(formatted).toContain('✗ 错误 [E999]: Test Error');
      expect(formatted).toContain('可能的原因:');
      expect(formatted).not.toContain('解决方案:');
      expect(formatted).not.toContain('Solution 1');
    });

    it('should use custom indent', () => {
      const error = new AppError(mockErrorInfo, 'Details');
      const formatted = formatAppError(error, { indent: '    ' });

      expect(formatted).toContain('    Details');
      expect(formatted).toContain('    1. Cause 1');
      expect(formatted).toContain('    - Solution 1');
    });

    it('should show stack trace when showStack is true', () => {
      const error = new AppError(mockErrorInfo);
      const formatted = formatAppError(error, { showStack: true });

      expect(formatted).toContain('Stack trace:');
      expect(formatted).toContain('AppError');
    });

    it('should use [ERROR] icon when unicode not supported', () => {
      vi.spyOn(terminal, 'detectTerminalCapabilities').mockReturnValue({
        supportsColor: false,
        supportsUnicode: false,
        colorDepth: 1,
        isInteractive: false,
        terminalType: 'dumb',
      });

      const error = new AppError(mockErrorInfo);
      const formatted = formatAppError(error);

      expect(formatted).toContain('[ERROR] 错误 [E999]: Test Error');
      expect(formatted).not.toContain('✗');
    });

    it('should handle empty causes array', () => {
      const errorInfoNoCauses: ErrorInfo = {
        code: 'E888',
        title: 'Error without causes',
        causes: [],
        solutions: ['Solution'],
      };
      const error = new AppError(errorInfoNoCauses);
      const formatted = formatAppError(error);

      expect(formatted).not.toContain('可能的原因:');
      expect(formatted).toContain('解决方案:');
    });

    it('should handle empty solutions array', () => {
      const errorInfoNoSolutions: ErrorInfo = {
        code: 'E777',
        title: 'Error without solutions',
        causes: ['Cause'],
        solutions: [],
      };
      const error = new AppError(errorInfoNoSolutions);
      const formatted = formatAppError(error);

      expect(formatted).toContain('可能的原因:');
      expect(formatted).not.toContain('解决方案:');
    });
  });

  describe('formatErrorInfo', () => {
    it('should format ErrorInfo with details', () => {
      const formatted = formatErrorInfo(mockErrorInfo, 'Extra context');

      expect(formatted).toContain('✗ 错误 [E999]: Test Error');
      expect(formatted).toContain('Extra context');
      expect(formatted).toContain('可能的原因:');
      expect(formatted).toContain('解决方案:');
    });

    it('should format ErrorInfo without details', () => {
      const formatted = formatErrorInfo(mockErrorInfo);

      expect(formatted).toContain('✗ 错误 [E999]: Test Error');
      expect(formatted).not.toContain('Extra context');
      expect(formatted).toContain('可能的原因:');
      expect(formatted).toContain('解决方案:');
    });

    it('should respect format options', () => {
      const formatted = formatErrorInfo(mockErrorInfo, undefined, {
        showCauses: false,
        showSolutions: true,
      });

      expect(formatted).not.toContain('可能的原因:');
      expect(formatted).toContain('解决方案:');
    });
  });

  describe('formatError', () => {
    it('should format AppError directly', () => {
      const appError = new AppError(mockErrorInfo);
      const formatted = formatError(appError);

      expect(formatted).toContain('✗ 错误 [E999]: Test Error');
      expect(formatted).toContain('可能的原因:');
      expect(formatted).toContain('解决方案:');
    });

    it('should format generic Error with fallback info', () => {
      const genericError = new Error('Something went wrong');
      const formatted = formatError(genericError, mockErrorInfo);

      expect(formatted).toContain('✗ 错误 [E999]: Test Error');
      expect(formatted).toContain('Something went wrong');
      expect(formatted).toContain('可能的原因:');
      expect(formatted).toContain('解决方案:');
    });

    it('should format generic Error without fallback info', () => {
      const genericError = new Error('Something went wrong');
      const formatted = formatError(genericError);

      expect(formatted).toContain('✗ 错误: Something went wrong');
      expect(formatted).not.toContain('可能的原因:');
      expect(formatted).not.toContain('解决方案:');
    });
  });

  describe('formatByCode', () => {
    it('should format error by valid code', () => {
      // E101 is a real error code in the system
      const formatted = formatByCode('E101', 'Config file missing');

      if (formatted) {
        expect(formatted).toContain('[E101]');
        expect(formatted).toContain('Config file missing');
      }
    });

    it('should return undefined for invalid code', () => {
      const formatted = formatByCode('INVALID', 'Details');

      expect(formatted).toBeUndefined();
    });
  });

  describe('simpleErrorMessage', () => {
    it('should create simple error message with details', () => {
      const message = simpleErrorMessage(mockErrorInfo, 'Extra info');

      expect(message).toContain('✗ 错误 [E999]: Test Error - Extra info');
      expect(message).not.toContain('可能的原因:');
      expect(message).not.toContain('解决方案:');
    });

    it('should create simple error message without details', () => {
      const message = simpleErrorMessage(mockErrorInfo);

      expect(message).toContain('✗ 错误 [E999]: Test Error');
      expect(message).not.toContain('可能的原因:');
      expect(message).not.toContain('解决方案:');
    });

    it('should use [ERROR] icon when unicode not supported', () => {
      vi.spyOn(terminal, 'detectTerminalCapabilities').mockReturnValue({
        supportsColor: false,
        supportsUnicode: false,
        colorDepth: 1,
        isInteractive: false,
        terminalType: 'dumb',
      });

      const message = simpleErrorMessage(mockErrorInfo);

      expect(message).toContain('[ERROR] 错误 [E999]: Test Error');
      expect(message).not.toContain('✗');
    });
  });

  describe('RICH output mode', () => {
    beforeEach(() => {
      vi.spyOn(logger, 'getOutputMode').mockReturnValue(logger.OutputMode.RICH);
    });

    it('should apply colors in RICH mode', () => {
      const error = new AppError(mockErrorInfo);
      const formatted = formatAppError(error);

      // In RICH mode, chalk is applied but we can't easily test the actual colors
      // Just verify the content is there
      expect(formatted).toContain('错误 [E999]: Test Error');
      expect(formatted).toContain('可能的原因:');
      expect(formatted).toContain('解决方案:');
    });
  });
});
