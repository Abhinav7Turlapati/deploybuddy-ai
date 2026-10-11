import { afterEach, describe, expect, it, vi } from 'vitest';
import { DiagnosticService } from '../src/services/diagnosticService';
import { bedrockAdapter } from '../src/services/bedrockAdapter';

const diagnosis = {
  id: 'local-diagnosis',
  title: 'Local Gemini Fallback',
} as never;

describe('DiagnosticService AWS fallback routing', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses the local diagnose route after an AWS adapter failure', async () => {
    vi.spyOn(bedrockAdapter, 'isLiveBackendEnabled').mockReturnValue(true);
    vi.spyOn(bedrockAdapter, 'diagnoseViaLambda').mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(diagnosis), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new DiagnosticService().diagnose('A sufficiently long local error log')).resolves.toEqual(diagnosis);
    expect(fetchMock).toHaveBeenCalledWith('/api/diagnose', expect.objectContaining({ method: 'POST' }));
  });

  it('uses the local chat route after an AWS adapter failure', async () => {
    vi.spyOn(bedrockAdapter, 'isLiveBackendEnabled').mockReturnValue(true);
    vi.spyOn(bedrockAdapter, 'sendChatViaLambda').mockResolvedValue(null);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ reply: 'Local Gemini fallback' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new DiagnosticService().respondToChat('Explain this', diagnosis, [])).resolves.toBe('Local Gemini fallback');
    expect(fetchMock).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }));
  });
});
