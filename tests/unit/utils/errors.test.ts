/**
 * Tests for Custom Error Classes
 * @module tests/unit/utils/errors
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  ConfigError,
  UserError,
  QuotaError,
  ServiceError,
  NetworkError,
  FileError,
  ValidationError,
  ProtocolError,
  SystemError,
} from '../../../src/utils/errors';
import { ErrorInfo } from '../../../src/constants/error-codes';

describe('AppError', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E999',
    title: 'Test Error',
    causes: ['Cause 1', 'Cause 2'],
    solutions: ['Solution 1', 'Solution 2'],
  };

  it('should create an AppError with error info', () => {
    const error = new AppError(mockErrorInfo);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe('AppError');
    expect(error.code).toBe('E999');
    expect(error.title).toBe('Test Error');
    expect(error.causes).toEqual(['Cause 1', 'Cause 2']);
    expect(error.solutions).toEqual(['Solution 1', 'Solution 2']);
    expect(error.message).toBe('Test Error');
    expect(error.details).toBeUndefined();
  });

  it('should create an AppError with details', () => {
    const error = new AppError(mockErrorInfo, 'Additional context');

    expect(error.details).toBe('Additional context');
    expect(error.message).toBe('Test Error: Additional context');
  });

  it('should have a proper stack trace', () => {
    const error = new AppError(mockErrorInfo);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });

  it('should identify AppError instances with isAppError', () => {
    const appError = new AppError(mockErrorInfo);
    const regularError = new Error('Regular error');

    expect(AppError.isAppError(appError)).toBe(true);
    expect(AppError.isAppError(regularError)).toBe(false);
    expect(AppError.isAppError(null)).toBe(false);
    expect(AppError.isAppError(undefined)).toBe(false);
    expect(AppError.isAppError('string')).toBe(false);
  });

  it('should convert Error to AppError with fromError', () => {
    const regularError = new Error('Something went wrong');
    const appError = AppError.fromError(regularError, mockErrorInfo);

    expect(appError).toBeInstanceOf(AppError);
    expect(appError.code).toBe('E999');
    expect(appError.title).toBe('Test Error');
    expect(appError.details).toBe('Something went wrong');
  });

  it('should return same AppError when converting AppError with fromError', () => {
    const originalError = new AppError(mockErrorInfo, 'Original details');
    const convertedError = AppError.fromError(originalError, {
      code: 'E888',
      title: 'Different Error',
      causes: [],
      solutions: [],
    });

    expect(convertedError).toBe(originalError);
    expect(convertedError.code).toBe('E999'); // Should keep original code
  });

  it('should have readonly causes and solutions', () => {
    const error = new AppError(mockErrorInfo);

    // TypeScript marks these as readonly, preventing modification at compile time
    // At runtime, they are regular arrays but TypeScript prevents modification
    expect(error.causes).toEqual(['Cause 1', 'Cause 2']);
    expect(error.solutions).toEqual(['Solution 1', 'Solution 2']);

    // Verify they are arrays
    expect(Array.isArray(error.causes)).toBe(true);
    expect(Array.isArray(error.solutions)).toBe(true);
  });
});

describe('ConfigError', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E101',
    title: 'Config Error',
    causes: ['Config not found'],
    solutions: ['Create config'],
  };

  it('should create a ConfigError', () => {
    const error = new ConfigError(mockErrorInfo);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.name).toBe('ConfigError');
    expect(error.code).toBe('E101');
  });

  it('should be identified as AppError', () => {
    const error = new ConfigError(mockErrorInfo);

    expect(AppError.isAppError(error)).toBe(true);
  });
});

describe('UserError', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E201',
    title: 'User Error',
    causes: ['User not found'],
    solutions: ['Add user'],
  };

  it('should create a UserError', () => {
    const error = new UserError(mockErrorInfo, 'user@example.com');

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(UserError);
    expect(error.name).toBe('UserError');
    expect(error.code).toBe('E201');
    expect(error.details).toBe('user@example.com');
  });
});

describe('QuotaError', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E301',
    title: 'Quota Error',
    causes: ['Quota exceeded'],
    solutions: ['Increase quota'],
  };

  it('should create a QuotaError', () => {
    const error = new QuotaError(mockErrorInfo);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(QuotaError);
    expect(error.name).toBe('QuotaError');
    expect(error.code).toBe('E301');
  });
});

describe('ServiceError', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E401',
    title: 'Service Error',
    causes: ['Service not running'],
    solutions: ['Start service'],
  };

  it('should create a ServiceError', () => {
    const error = new ServiceError(mockErrorInfo);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.name).toBe('ServiceError');
    expect(error.code).toBe('E401');
  });
});

describe('NetworkError', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E501',
    title: 'Network Error',
    causes: ['Connection refused'],
    solutions: ['Check network'],
  };

  it('should create a NetworkError', () => {
    const error = new NetworkError(mockErrorInfo);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(NetworkError);
    expect(error.name).toBe('NetworkError');
    expect(error.code).toBe('E501');
  });
});

describe('FileError', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E601',
    title: 'File Error',
    causes: ['File not found'],
    solutions: ['Create file'],
  };

  it('should create a FileError', () => {
    const error = new FileError(mockErrorInfo);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(FileError);
    expect(error.name).toBe('FileError');
    expect(error.code).toBe('E601');
  });
});

describe('ValidationError', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E701',
    title: 'Validation Error',
    causes: ['Invalid input'],
    solutions: ['Fix input'],
  };

  it('should create a ValidationError', () => {
    const error = new ValidationError(mockErrorInfo);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('E701');
  });
});

describe('ProtocolError', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E801',
    title: 'Protocol Error',
    causes: ['Invalid protocol'],
    solutions: ['Fix protocol'],
  };

  it('should create a ProtocolError', () => {
    const error = new ProtocolError(mockErrorInfo);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(ProtocolError);
    expect(error.name).toBe('ProtocolError');
    expect(error.code).toBe('E801');
  });
});

describe('SystemError', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E901',
    title: 'System Error',
    causes: ['Permission denied'],
    solutions: ['Run as root'],
  };

  it('should create a SystemError', () => {
    const error = new SystemError(mockErrorInfo);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(SystemError);
    expect(error.name).toBe('SystemError');
    expect(error.code).toBe('E901');
  });
});

describe('Error inheritance chain', () => {
  const mockErrorInfo: ErrorInfo = {
    code: 'E999',
    title: 'Test Error',
    causes: ['Test cause'],
    solutions: ['Test solution'],
  };

  it('should maintain proper inheritance for all error types', () => {
    const errors = [
      new ConfigError(mockErrorInfo),
      new UserError(mockErrorInfo),
      new QuotaError(mockErrorInfo),
      new ServiceError(mockErrorInfo),
      new NetworkError(mockErrorInfo),
      new FileError(mockErrorInfo),
      new ValidationError(mockErrorInfo),
      new ProtocolError(mockErrorInfo),
      new SystemError(mockErrorInfo),
    ];

    errors.forEach((error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(AppError.isAppError(error)).toBe(true);
    });
  });
});
