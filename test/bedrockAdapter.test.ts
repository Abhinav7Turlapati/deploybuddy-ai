import { afterEach, describe, expect, it } from 'vitest';
import { BedrockLambdaAdapter } from '../src/services/bedrockAdapter';
import { createMockAwsServer } from './mockAwsApi';

describe('BedrockLambdaAdapter (mocked local testing only)', () => {
  let server: ReturnType<typeof createMockAwsServer> | undefined;

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => server?.close(() => resolve()));
      server = undefined;
    }
  });

  async function startMock(scenario: 'success' | 'http-error' | 'malformed'): Promise<string> {
    server = createMockAwsServer(scenario);
    await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Mock AWS server did not expose a port.');
    }
    return `http://127.0.0.1:${address.port}`;
  }

  it('handles valid diagnose and chat responses', async () => {
    const adapter = new BedrockLambdaAdapter({ apiEndpoint: await startMock('success') });

    await expect(adapter.diagnoseViaLambda({ errorLog: 'mock error log' })).resolves.toMatchObject({
      title: 'Mock Lambda Diagnosis',
      modelProvider: 'Mock AWS Adapter',
    });
    await expect(adapter.sendChatViaLambda({
      diagnosticContext: {} as never,
      conversationHistory: [],
      userMessage: 'What should I try?',
    })).resolves.toBe('Mock AWS adapter chat response.');
  });

  it('allows local app origins to complete CORS preflight requests', async () => {
    const endpoint = await startMock('success');
    const response = await fetch(`${endpoint}/diagnose`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
  });

  it('rejects origins outside the local allowlist', async () => {
    const endpoint = await startMock('success');
    const response = await fetch(`${endpoint}/diagnose`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    expect(response.status).toBe(403);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('returns null for HTTP errors', async () => {
    const adapter = new BedrockLambdaAdapter({ apiEndpoint: await startMock('http-error') });

    await expect(adapter.diagnoseViaLambda({ errorLog: 'mock error log' })).resolves.toBeNull();
    await expect(adapter.sendChatViaLambda({
      diagnosticContext: {} as never,
      conversationHistory: [],
      userMessage: 'What should I try?',
    })).resolves.toBeNull();
  });

  it('returns null for malformed responses', async () => {
    const adapter = new BedrockLambdaAdapter({ apiEndpoint: await startMock('malformed') });

    await expect(adapter.diagnoseViaLambda({ errorLog: 'mock error log' })).resolves.toBeNull();
    await expect(adapter.sendChatViaLambda({
      diagnosticContext: {} as never,
      conversationHistory: [],
      userMessage: 'What should I try?',
    })).resolves.toBeNull();
  });

  it('returns null for network failures', async () => {
    const adapter = new BedrockLambdaAdapter({ apiEndpoint: 'http://127.0.0.1:9' });

    await expect(adapter.diagnoseViaLambda({ errorLog: 'mock error log' })).resolves.toBeNull();
    await expect(adapter.sendChatViaLambda({
      diagnosticContext: {} as never,
      conversationHistory: [],
      userMessage: 'What should I try?',
    })).resolves.toBeNull();
  });
});
