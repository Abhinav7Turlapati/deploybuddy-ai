import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.VITEST = 'true';

// Mock @google/genai module before importing server
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    public models = {
      generateContent: mockGenerateContent,
    };
  }

  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: {
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      INTEGER: 'INTEGER',
      BOOLEAN: 'BOOLEAN',
      ARRAY: 'ARRAY',
      OBJECT: 'OBJECT',
    },
  };
});

import request from 'supertest';
import { app } from '../server';

/**
 * ============================================================================
 * UNIT TESTS (MOCKED EXTERNAL AI CALLS)
 * ============================================================================
 * NOTE: All external calls to @google/genai are explicitly mocked in this suite.
 * These unit tests verify endpoint status codes, validation logic, error propagation,
 * rate limiting, and output formatting without performing live billable AI inference.
 * ============================================================================
 */

describe('DeployBuddy AI - Backend API Suite (Mocked Unit Tests)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'test', VITEST: 'true' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // --------------------------------------------------------------------------
  // 1. GET /api/status tests
  // --------------------------------------------------------------------------
  describe('GET /api/status', () => {
    it('returns configured: false when GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.VITE_AWS_API_URL;
      delete process.env.AWS_LAMBDA_ENDPOINT;

      const res = await request(app).get('/api/status');
      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(false);
      expect(res.body.provider).toBe('none');
      expect(res.body.message).toContain('GEMINI_API_KEY is missing');
    });

    it('returns configured: false when GEMINI_API_KEY is the template placeholder', async () => {
      process.env.GEMINI_API_KEY = 'MY_GEMINI_API_KEY';
      delete process.env.VITE_AWS_API_URL;
      delete process.env.AWS_LAMBDA_ENDPOINT;

      const res = await request(app).get('/api/status');
      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(false);
      expect(res.body.provider).toBe('none');
    });

    it('returns configured: true and gemini provider when GEMINI_API_KEY is present', async () => {
      process.env.GEMINI_API_KEY = 'test-valid-api-key-12345';

      const res = await request(app).get('/api/status');
      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(true);
      expect(res.body.provider).toBe('gemini');
      expect(res.body.model).toBe('gemini-3.1-flash-lite');
    });

    it('returns configured: true and aws provider when only AWS URL is configured', async () => {
      delete process.env.GEMINI_API_KEY;
      process.env.VITE_AWS_API_URL = 'https://api.example.com/prod';

      const res = await request(app).get('/api/status');
      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(true);
      expect(res.body.provider).toBe('aws');
      expect(res.body.model).toBe('amazon-bedrock');
    });
  });

  // --------------------------------------------------------------------------
  // 2. POST /api/diagnose tests
  // --------------------------------------------------------------------------
  describe('POST /api/diagnose', () => {
    it('returns 400 when errorLog is missing or empty', async () => {
      const res = await request(app)
        .post('/api/diagnose')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      expect(res.body.message).toContain('Please paste an error log');
    });

    it('returns 400 when errorLog contains only whitespace', async () => {
      const res = await request(app)
        .post('/api/diagnose')
        .send({ errorLog: '     \n\t   ' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
    });

    it('returns 400 when errorLog is too short (< 15 characters)', async () => {
      const res = await request(app)
        .post('/api/diagnose')
        .send({ errorLog: 'Error 500' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Input Too Short');
      expect(res.body.message).toContain('too brief');
    });

    it('returns 503 when GEMINI_API_KEY is not configured', async () => {
      delete process.env.GEMINI_API_KEY;

      const res = await request(app)
        .post('/api/diagnose')
        .send({ errorLog: 'org.springframework.boot.web.server.PortInUseException: Port 8080 is already in use' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Model Configuration Missing');
      expect(res.body.code).toBe('MISSING_API_KEY');
    });

    it('returns 200 with structured diagnosis on successful AI response (MOCKED)', async () => {
      process.env.GEMINI_API_KEY = 'test-key-mock';

      const mockAiOutput = {
        title: 'Port 8080 In Use Conflict',
        category: 'spring-boot',
        categoryLabel: 'Spring Boot',
        severity: 'Medium',
        confidenceLevel: 'High',
        badgeLabel: 'AI Diagnosed',
        summary: 'Your Spring Boot application failed to start because another process is already bound to port 8080.',
        factsFound: [
          'Port 8080 was already in use',
          'org.springframework.boot.web.server.PortInUseException thrown at TomcatWebServer.start'
        ],
        hypotheses: [
          'A previous instance of the Spring Boot application was not cleanly stopped',
          'Another local server (like Jenkins, Tomcat, or an Oracle XE listener) is occupying port 8080'
        ],
        likelyCauses: ['Port 8080 already bound by another background process.'],
        safeTroubleshootingSteps: [
          {
            step: 1,
            title: 'Identify the conflicting PID',
            detail: 'Find out which process currently holds port 8080.',
            codeSnippet: 'lsof -i :8080'
          },
          {
            step: 2,
            title: 'Terminate the old process',
            detail: 'Stop the leftover instance to free the port.',
            codeSnippet: 'kill -9 <PID>'
          }
        ],
        commands: [
          {
            command: 'lsof -i :8080',
            description: 'Check what program is listening on port 8080',
            os: 'mac-linux',
            safetyLevel: 'Safe'
          },
          {
            command: 'netstat -ano | findstr :8080',
            description: 'Check port 8080 listeners on Windows',
            os: 'windows',
            safetyLevel: 'Safe'
          },
          {
            command: 'kill -9 <PID>',
            description: 'Terminate the lingering process by ID',
            os: 'mac-linux',
            safetyLevel: 'Caution',
            warning: 'Ensure the PID matches your leftover Java process before terminating.'
          }
        ],
        whyThisWorks: 'TCP ports can only be bound by one process listening at any given time. Terminating the old process frees the port socket.',
        beginnerTip: 'Whenever Spring crashes on port 8080, check if your IDE left a hidden background run active.',
        jargonBuster: [
          {
            term: 'TCP Port',
            definition: 'A virtual channel that routes traffic to a specific software program.',
            analogy: 'Like apartment numbers inside a single building.'
          }
        ],
        preventativeMeasures: [
          'Use server.port=0 in application.properties for dynamic random ports in integration tests.'
        ]
      };

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify(mockAiOutput)
      });

      const res = await request(app)
        .post('/api/diagnose')
        .send({
          errorLog: 'org.springframework.boot.web.server.PortInUseException: Port 8080 is already in use at TomcatWebServer.start'
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Port 8080 In Use Conflict');
      expect(res.body.category).toBe('spring-boot');
      expect(res.body.confidenceLevel).toBe('High');
      expect(res.body.factsFound).toHaveLength(2);
      expect(res.body.hypotheses).toHaveLength(2);
      expect(res.body.commands).toHaveLength(3);
      expect(res.body.isAiGenerated).toBe(true);
      expect(res.body.modelProvider).toContain('Google Gemini');
      // Verify safe commands tagging
      expect(res.body.commands[0].safetyLevel).toBe('Safe');
      expect(res.body.commands[2].safetyLevel).toBe('Caution');
      expect(res.body.commands[2].warning).toBeDefined();
    });

    it('correctly handles fenced markdown json responses from AI model (MOCKED)', async () => {
      process.env.GEMINI_API_KEY = 'test-key-mock';

      const mockAiOutput = {
        title: 'Docker Daemon Unreachable',
        category: 'docker',
        categoryLabel: 'Docker',
        severity: 'High',
        confidenceLevel: 'High',
        summary: 'Docker client cannot communicate with the docker daemon socket.',
        factsFound: ['Cannot connect to Docker daemon at unix:///var/run/docker.sock'],
        hypotheses: ['Docker Desktop is not running'],
        likelyCauses: ['Docker engine service is offline.'],
        safeTroubleshootingSteps: [{ step: 1, title: 'Start Docker Desktop', detail: 'Open Docker Desktop.' }],
        commands: [{ command: 'docker info', description: 'Check docker status', safetyLevel: 'Safe' }],
        whyThisWorks: 'The CLI communicates through a unix domain socket.',
        beginnerTip: 'Always verify Docker Desktop shows green status before running docker commands.'
      };

      // Wrap in markdown code fence with surrounding whitespace
      mockGenerateContent.mockResolvedValueOnce({
        text: `\`\`\`json\n${JSON.stringify(mockAiOutput)}\n\`\`\``
      });

      const res = await request(app)
        .post('/api/diagnose')
        .send({
          errorLog: 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?'
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Docker Daemon Unreachable');
      expect(res.body.category).toBe('docker');
    });

    it('extracts JSON when model surrounds JSON with conversational text without backticks (MOCKED)', async () => {
      process.env.GEMINI_API_KEY = 'test-key-mock';

      const mockAiOutput = {
        title: 'Kubernetes OOMKilled Error',
        category: 'kubernetes',
        categoryLabel: 'Kubernetes',
        severity: 'Critical',
        summary: 'Container exceeded pod memory allocation limits.'
      };

      // Model output with conversational preamble and postscript without markdown fence
      mockGenerateContent.mockResolvedValueOnce({
        text: `Here is the diagnosis you requested:\n${JSON.stringify(mockAiOutput)}\nHope this helps!`
      });

      const res = await request(app)
        .post('/api/diagnose')
        .send({
          errorLog: 'NAME payment-service 0/1 CrashLoopBackOff Terminated Exit Code 137 OOMKilled'
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Kubernetes OOMKilled Error');
      expect(res.body.category).toBe('kubernetes');
    });

    it('returns 502 with PARSE_ERROR when model generates invalid or incomplete JSON (MOCKED)', async () => {
      process.env.GEMINI_API_KEY = 'test-key-mock';

      mockGenerateContent.mockResolvedValueOnce({
        text: '{"title": "Broken Json without closing braces or valid syntax...'
      });

      const res = await request(app)
        .post('/api/diagnose')
        .send({
          errorLog: 'NAME payment-service 0/1 CrashLoopBackOff Terminated Exit Code 137 OOMKilled'
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe('Invalid AI Model Response');
      expect(res.body.code).toBe('PARSE_ERROR');
    });

    it('returns 429 when AI model rate limit is exceeded (MOCKED)', async () => {
      process.env.GEMINI_API_KEY = 'test-key-mock';

      const rateLimitError: any = new Error('Resource has been exhausted (e.g. check quota).');
      rateLimitError.status = 429;
      mockGenerateContent.mockRejectedValue(rateLimitError);

      const res = await request(app)
        .post('/api/diagnose')
        .send({
          errorLog: 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?'
        });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Rate Limit Reached');
      expect(res.body.code).toBe('RATE_LIMIT');
    });

    it('returns 503 when AI model service is unavailable (MOCKED)', async () => {
      process.env.GEMINI_API_KEY = 'test-key-mock';

      const unavailableError: any = new Error('The service is temporarily unavailable.');
      unavailableError.status = 503;
      mockGenerateContent.mockRejectedValue(unavailableError);

      const res = await request(app)
        .post('/api/diagnose')
        .send({
          errorLog: 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?'
        });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('AI Model Service Temporarily Unavailable');
      expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('returns 500 when AI model encounters an unexpected error (MOCKED)', async () => {
      process.env.GEMINI_API_KEY = 'test-key-mock';

      mockGenerateContent.mockRejectedValue(new Error('Internal server processing fault'));

      const res = await request(app)
        .post('/api/diagnose')
        .send({
          errorLog: 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?'
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('AI Diagnosis Error');
      expect(res.body.message).toContain('Internal server processing fault');
    });
  });

  // --------------------------------------------------------------------------
  // 3. POST /api/chat tests
  // --------------------------------------------------------------------------
  describe('POST /api/chat', () => {
    it('returns 400 when userMessage is missing or empty', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Message cannot be empty.');
    });

    it('returns 503 when GEMINI_API_KEY is not configured', async () => {
      delete process.env.GEMINI_API_KEY;

      const res = await request(app)
        .post('/api/chat')
        .send({ userMessage: 'Can you explain step 1 in more detail?' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Model Configuration Missing');
    });

    it('returns 200 with mentoring reply on success (MOCKED)', async () => {
      process.env.GEMINI_API_KEY = 'test-key-mock';

      mockGenerateContent.mockResolvedValueOnce({
        text: 'Great question! To run Spring Boot on another port, add `server.port=8081` to your `application.properties` file.'
      });

      const res = await request(app)
        .post('/api/chat')
        .send({
          userMessage: 'How do I run on port 8081 instead?',
          diagnosticContext: {
            title: 'Port 8080 In Use',
            categoryLabel: 'Spring Boot',
            severity: 'Medium',
            summary: 'Port 8080 conflict',
            factsFound: ['Port 8080 in use'],
            likelyCauses: ['Another app is listening on 8080'],
            safeTroubleshootingSteps: [{ step: 1, title: 'Kill old process' }],
            commands: [{ command: 'lsof -i :8080' }]
          },
          conversationHistory: []
        });

      expect(res.status).toBe(200);
      expect(res.body.reply).toContain('server.port=8081');
    });

    it('returns 429 when chat encounters rate limit (MOCKED)', async () => {
      process.env.GEMINI_API_KEY = 'test-key-mock';

      const rateLimitError: any = new Error('Rate limit exceeded');
      rateLimitError.status = 429;
      mockGenerateContent.mockRejectedValue(rateLimitError);

      const res = await request(app)
        .post('/api/chat')
        .send({
          userMessage: 'Explain step 2'
        });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Rate Limit Reached');
    });

    it('returns 500 when chat fails unexpectedly (MOCKED)', async () => {
      process.env.GEMINI_API_KEY = 'test-key-mock';

      mockGenerateContent.mockRejectedValue(new Error('Model inference timeout'));

      const res = await request(app)
        .post('/api/chat')
        .send({
          userMessage: 'Explain step 2'
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Chat Processing Error');
    });
  });
});
