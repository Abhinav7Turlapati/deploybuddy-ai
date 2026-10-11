import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';

export type MockAwsScenario = 'success' | 'http-error' | 'malformed';

const diagnosis = {
  id: 'mock-diagnosis',
  title: 'Mock Lambda Diagnosis',
  category: 'general',
  categoryLabel: 'General Software',
  severity: 'Low',
  confidenceLevel: 'High',
  summary: 'This response came from the local AWS adapter mock.',
  whatHappened: 'This response came from the local AWS adapter mock.',
  factsFound: ['The local mock endpoint received the request.'],
  hypotheses: [],
  likelyCauses: ['Mock response only.'],
  likelyCause: 'Mock response only.',
  safeTroubleshootingSteps: [],
  suggestedFix: [],
  commands: [],
  whyThisWorks: 'The mock lets the adapter contract be tested without external services.',
  beginnerTip: 'This is mocked local testing, not an Amazon Bedrock integration.',
  jargonBuster: [],
  preventativeMeasures: [],
  rawSnippet: 'mock error log',
  timestamp: 0,
  isAiGenerated: false,
  modelProvider: 'Mock AWS Adapter',
};

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

function applyCorsHeaders(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin;
  if (!origin || !allowedOrigins.has(origin)) {
    return false;
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  return true;
}

function sendJson(req: IncomingMessage, res: ServerResponse, status: number, body: unknown): void {
  applyCorsHeaders(req, res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function handleRequest(req: IncomingMessage, res: ServerResponse, scenario: MockAwsScenario): void {
  const hasAllowedOrigin = applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    if (!hasAllowedOrigin) {
      res.writeHead(403);
      res.end();
      return;
    }

    res.writeHead(204);
    res.end();
    return;
  }

  if (req.headers.origin && !hasAllowedOrigin) {
    res.writeHead(403);
    res.end();
    return;
  }

  if (req.method !== 'POST' || (req.url !== '/diagnose' && req.url !== '/chat')) {
    sendJson(req, res, 404, { message: 'Mock route not found.' });
    return;
  }

  if (scenario === 'http-error') {
    sendJson(req, res, 503, { message: 'Mock AWS endpoint unavailable.' });
    return;
  }

  if (scenario === 'malformed') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(req.url === '/diagnose' ? JSON.stringify({ invalid: true }) : JSON.stringify({ reply: 42 }));
    return;
  }

  sendJson(req, res, 200, req.url === '/diagnose' ? diagnosis : {
    reply: 'Mock AWS adapter chat response.',
  });
}

export function createMockAwsServer(scenario: MockAwsScenario = 'success'): Server {
  return createServer((req, res) => handleRequest(req, res, scenario));
}

if (process.env.NODE_ENV !== 'test') {
  const scenario = (process.env.MOCK_AWS_SCENARIO || 'success') as MockAwsScenario;
  const server = createMockAwsServer(scenario);
  server.listen(4010, '127.0.0.1', () => {
    console.log(`[Mock AWS testing only] Listening on http://127.0.0.1:4010 (${scenario})`);
  });
}
