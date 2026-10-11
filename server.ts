import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '2mb' }));

// Helper to check for Gemini API key
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health & configuration status endpoint
app.get('/api/status', (req: Request, res: Response) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const hasAwsConfig = Boolean(process.env.VITE_AWS_API_URL || process.env.VITE_LAMBDA_API_URL);

  if (!hasGeminiKey && !hasAwsConfig) {
    return res.status(200).json({
      configured: false,
      provider: 'none',
      message: 'No live AI model provider is configured. GEMINI_API_KEY is missing.',
    });
  }

  return res.status(200).json({
    configured: true,
    provider: hasAwsConfig ? 'aws' : 'gemini',
    model: hasAwsConfig ? 'amazon-bedrock' : 'gemini-3.1-flash-lite',
  });
});

// Candidate models in order of stability and latency (primary: gemini-3.1-flash-lite)
const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

// Helper to invoke Gemini with fallback between 3.1-flash-lite, flash-latest, and 3.8-flash
export async function generateDiagnosticContent(ai: GoogleGenAI, prompt: string, systemPrompt: string) {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
        },
      });

      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      // If 503 or 429, try the next model
      if (err.status === 503 || err.status === 429 || (err.message && err.message.includes('503'))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All candidate AI models were unavailable.');
}

export async function generateChatContent(ai: GoogleGenAI, contents: any[], systemPrompt: string) {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
        },
      });

      if (response && response.text) {
        return { text: response.text, modelUsed: model };
      }
    } catch (err: any) {
      lastError = err;
      if (err.status === 503 || err.status === 429 || (err.message && err.message.includes('503'))) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All candidate AI models were unavailable.');
}

// POST /api/diagnose - Real AI diagnostic engine
app.post('/api/diagnose', async (req: Request, res: Response) => {
  try {
    const { errorLog } = req.body;

    if (!errorLog || typeof errorLog !== 'string' || !errorLog.trim()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please paste an error log to begin diagnosis.',
      });
    }

    const trimmed = errorLog.trim();
    if (trimmed.length < 15) {
      return res.status(400).json({
        error: 'Input Too Short',
        message: 'The pasted log is too brief. Please paste the full terminal output, stack trace, or error lines for an accurate diagnosis.',
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Model Configuration Missing',
        code: 'MISSING_API_KEY',
        message: 'Real AI model diagnosis cannot run because GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in the Secrets panel, or connect to an AWS Lambda API endpoint via VITE_AWS_API_URL.',
      });
    }

    const systemPrompt = `You are DeployBuddy AI, an empathetic senior developer mentor for beginners.
Analyze programming and deployment error logs (Spring Boot, Docker, Kubernetes, GitHub Actions, Node.js, Python, etc.).

CRITICAL REQUIREMENTS:
1. Clearly distinguish verifiable FACTS found directly in the log (error messages, files, HTTP codes, exit codes, PIDs) from HYPOTHESES (reasoned deductions about why this happened).
2. Set confidenceLevel to "High", "Medium", or "Low".
3. Provide safe, ordered troubleshooting steps.
4. Provide platform-specific commands tagged with os: "mac-linux", "windows", or "any", and safetyLevel: "Safe", "Caution", or "Destructive".
5. NEVER recommend destructive commands without marking safetyLevel as "Caution" or "Destructive" and specifying an explicit "warning". Commands are NEVER auto-executed.
6. Explain "whyThisWorks" simply so the beginner understands the underlying system.
7. Return valid JSON only.

Output JSON format:
{
  "title": string,
  "category": "spring-boot" | "docker" | "kubernetes" | "github-actions" | "general",
  "categoryLabel": string,
  "severity": "Low" | "Medium" | "High" | "Critical",
  "confidenceLevel": "High" | "Medium" | "Low",
  "badgeLabel": string,
  "summary": string,
  "factsFound": string[],
  "hypotheses": string[],
  "likelyCauses": string[],
  "safeTroubleshootingSteps": [{ "step": number, "title": string, "detail": string, "codeSnippet"?: string }],
  "commands": [{ "command": string, "description": string, "os": "mac-linux" | "windows" | "any", "safetyLevel": "Safe" | "Caution" | "Destructive", "warning"?: string }],
  "whyThisWorks": string,
  "beginnerTip": string,
  "jargonBuster": [{ "term": string, "definition": string, "analogy": string }],
  "preventativeMeasures": string[]
}`;

    const prompt = `Analyze this error log and provide a complete structured diagnosis:\n\n\`\`\`\n${trimmed}\n\`\`\``;

    const { text, modelUsed } = await generateDiagnosticContent(ai, prompt, systemPrompt);

    // Clean any accidental markdown fence or surrounding text around JSON
    let cleanJson = text.trim();
    const fencedMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fencedMatch) {
      cleanJson = fencedMatch[1].trim();
    } else {
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn('[server] Failed to parse model output as JSON:', cleanJson);
      return res.status(502).json({
        error: 'Invalid AI Model Response',
        code: 'PARSE_ERROR',
        message: 'The AI model generated an unparseable response format. Please retry diagnosing your error log.',
      });
    }

    // Populate response with backward-compatible aliases
    const result = {
      id: `diag-${Date.now()}`,
      title: parsed.title || 'Deployment Error Analysis',
      category: parsed.category || 'general',
      categoryLabel: parsed.categoryLabel || parsed.category || 'General Software',
      severity: parsed.severity || 'Medium',
      confidenceLevel: parsed.confidenceLevel || 'High',
      badgeLabel: parsed.badgeLabel || 'AI Diagnosed',
      summary: parsed.summary || 'An error was detected in your logs.',
      whatHappened: parsed.summary || 'An error was detected in your logs.',
      factsFound: Array.isArray(parsed.factsFound) ? parsed.factsFound : [],
      hypotheses: Array.isArray(parsed.hypotheses) ? parsed.hypotheses : [],
      likelyCauses: Array.isArray(parsed.likelyCauses) ? parsed.likelyCauses : [parsed.likelyCauses || ''],
      likelyCause: Array.isArray(parsed.likelyCauses) ? parsed.likelyCauses.join(' ') : (parsed.likelyCauses || ''),
      safeTroubleshootingSteps: Array.isArray(parsed.safeTroubleshootingSteps) ? parsed.safeTroubleshootingSteps : (parsed.suggestedFix || []),
      suggestedFix: Array.isArray(parsed.safeTroubleshootingSteps) ? parsed.safeTroubleshootingSteps : (parsed.suggestedFix || []),
      commands: Array.isArray(parsed.commands) ? parsed.commands : [],
      whyThisWorks: parsed.whyThisWorks || 'Addressing the root cause restores expected system operation.',
      beginnerTip: parsed.beginnerTip || 'Always scan for "Caused by:" lines in stack traces first.',
      jargonBuster: Array.isArray(parsed.jargonBuster) ? parsed.jargonBuster : [],
      preventativeMeasures: Array.isArray(parsed.preventativeMeasures) ? parsed.preventativeMeasures : [],
      rawSnippet: trimmed,
      timestamp: Date.now(),
      isAiGenerated: true,
      modelProvider: `Google Gemini (${modelUsed})`,
    };

    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[API /diagnose error]:', err);

    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({
        error: 'Rate Limit Reached',
        code: 'RATE_LIMIT',
        message: 'The AI model service is currently experiencing high demand. Please wait a moment and try again.',
      });
    }

    if (err.status === 503 || (err.message && err.message.includes('503'))) {
      return res.status(503).json({
        error: 'AI Model Service Temporarily Unavailable',
        code: 'SERVICE_UNAVAILABLE',
        message: 'The AI model is currently undergoing high demand. Please try clicking Diagnose again in a few seconds.',
      });
    }

    return res.status(500).json({
      error: 'AI Diagnosis Error',
      message: err.message || 'An unexpected error occurred while communicating with the AI model.',
    });
  }
});

// POST /api/chat - Follow-up mentoring conversation
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { userMessage, diagnosticContext, conversationHistory } = req.body;

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Model Configuration Missing',
        message: 'Real AI chat cannot run because GEMINI_API_KEY is not configured in the server environment.',
      });
    }

    const contextSnippet = diagnosticContext
      ? `CURRENT DIAGNOSIS CONTEXT:
Title: ${diagnosticContext.title}
Category: ${diagnosticContext.categoryLabel}
Severity: ${diagnosticContext.severity}
Confidence: ${diagnosticContext.confidenceLevel || 'High'}
Summary: ${diagnosticContext.summary || diagnosticContext.whatHappened}
Facts Found: ${(diagnosticContext.factsFound || []).join(', ')}
Likely Causes: ${(diagnosticContext.likelyCauses || [diagnosticContext.likelyCause]).join(', ')}
Suggested Fixes: ${(diagnosticContext.safeTroubleshootingSteps || diagnosticContext.suggestedFix || []).map((s: any) => s.title).join('; ')}
Commands: ${(diagnosticContext.commands || []).map((c: any) => c.command).join(', ')}`
      : 'No active error diagnosis context.';

    const systemPrompt = `You are DeployBuddy AI, a warm, supportive senior developer mentor answering a junior developer's follow-up questions.
Speak conversationally, use simple real-world analogies, give concrete code snippets where helpful, and keep explanations safe.
Never recommend destructive commands without clear warnings.

${contextSnippet}`;

    const formattedHistory = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-8).map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }))
      : [];

    const contents = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: userMessage.trim() }],
      },
    ];

    const { text: replyText } = await generateChatContent(ai, contents, systemPrompt);

    const reply = replyText || "I'm here to help! Could you clarify what you'd like to try next?";
    return res.status(200).json({ reply });
  } catch (err: any) {
    console.error('[API /chat error]:', err);

    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({
        error: 'Rate Limit Reached',
        message: 'Rate limit reached. Please wait a few seconds before sending another message.',
      });
    }

    if (err.status === 503 || (err.message && err.message.includes('503'))) {
      return res.status(503).json({
        error: 'AI Model Service Temporarily Unavailable',
        message: 'Chat service is temporarily experiencing high load. Please try again shortly.',
      });
    }

    return res.status(500).json({
      error: 'Chat Processing Error',
      message: err.message || 'Failed to generate answer.',
    });
  }
});

export { app };

// Start Full-Stack Express Server (with Vite integration)
async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DeployBuddy AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  start().catch((err) => {
    console.error('[Server startup error]:', err);
  });
}
