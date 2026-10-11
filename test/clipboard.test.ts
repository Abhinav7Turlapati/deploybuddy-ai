import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyTextToClipboard } from '../src/utils/clipboard';

describe('copyTextToClipboard Utility', () => {
  const originalNavigator = global.navigator;
  const originalDocument = global.document;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'document', {
      value: originalDocument,
      writable: true,
      configurable: true,
    });
  });

  it('returns false when text is empty or falsy', async () => {
    const res = await copyTextToClipboard('');
    expect(res).toBe(false);
  });

  it('uses navigator.clipboard.writeText when available and returns true on success', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {
          writeText: writeTextMock,
        },
      },
      writable: true,
      configurable: true,
    });

    const res = await copyTextToClipboard('docker ps -a');
    expect(res).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('docker ps -a');
  });

  it('falls back to execCommand when navigator.clipboard.writeText throws', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Permission denied'));
    const execCommandMock = vi.fn().mockReturnValue(true);

    const mockTextarea = {
      value: '',
      style: {},
      setAttribute: vi.fn(),
      select: vi.fn(),
    };

    const createElementMock = vi.fn().mockReturnValue(mockTextarea);
    const appendChildMock = vi.fn();
    const removeChildMock = vi.fn();

    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {
          writeText: writeTextMock,
        },
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'document', {
      value: {
        createElement: createElementMock,
        execCommand: execCommandMock,
        body: {
          appendChild: appendChildMock,
          removeChild: removeChildMock,
        },
      },
      writable: true,
      configurable: true,
    });

    const res = await copyTextToClipboard('kill -9 1234');
    expect(res).toBe(true);
    expect(writeTextMock).toHaveBeenCalled();
    expect(createElementMock).toHaveBeenCalledWith('textarea');
    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(removeChildMock).toHaveBeenCalledWith(mockTextarea);
  });

  it('returns false when both clipboard API and execCommand fail', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Blocked')),
        },
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'document', {
      value: {
        createElement: vi.fn().mockReturnValue({
          style: {},
          setAttribute: vi.fn(),
          select: vi.fn(),
        }),
        execCommand: vi.fn().mockReturnValue(false),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      },
      writable: true,
      configurable: true,
    });

    const res = await copyTextToClipboard('sample command');
    expect(res).toBe(false);
  });
});
