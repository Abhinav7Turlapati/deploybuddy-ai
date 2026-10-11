import { DiagnosticResult, ChatMessage } from '../types/diagnosis';
import { bedrockAdapter } from './bedrockAdapter';

export interface DiagnoseOptions {
  onProgress?: (message: string, progress: number) => void;
}

export class DiagnosticService {
  /**
   * Main diagnostic entry point
   * Decoupled from React UI; connects to live AI model backend
   */
  public async diagnose(errorLog: string, options?: DiagnoseOptions): Promise<DiagnosticResult> {
    const trimmed = errorLog.trim();
    if (!trimmed) {
      throw new Error('Please paste an error log to begin diagnosis.');
    }

    if (trimmed.length < 15) {
      throw new Error('The pasted error log is too brief. Please paste the full terminal output, stack trace, or error lines for an accurate diagnosis.');
    }

    // Step-by-step progress feedback for responsive UI
    options?.onProgress?.('Parsing error logs and isolating failure patterns...', 25);

    // Check if AWS Lambda / Bedrock is configured directly on client
    if (bedrockAdapter.isLiveBackendEnabled()) {
      options?.onProgress?.('Routing request to AWS Bedrock Lambda endpoint...', 50);
      const awsResult = await bedrockAdapter.diagnoseViaLambda({ errorLog: trimmed });
      if (awsResult) {
        options?.onProgress?.('Formatting structured AWS Bedrock diagnosis...', 95);
        return awsResult;
      }
    }

    options?.onProgress?.('Engaging AI reasoning engine to analyze error logs...', 55);

    const endpoint = '/api/diagnose';
    let response: Response;

    try {
      options?.onProgress?.('Correlating error signatures and verifying facts vs hypotheses...', 75);
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errorLog: trimmed }),
      });
    } catch (networkErr: any) {
      console.error('[DiagnosticService Network Error]:', networkErr);
      throw new Error(
        `Failed to reach the AI diagnosis service (${networkErr.message || 'Network error'}). Please ensure the server is running on port 3000.`
      );
    }

    options?.onProgress?.('Synthesizing safe troubleshooting steps and commands...', 90);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Graceful error handling for missing configuration, rate limits, or validation
      if (response.status === 503) {
        throw new Error(
          data?.message ||
          'No local Gemini provider is configured. Please configure GEMINI_API_KEY in server secrets. An external adapter endpoint, if configured, was unavailable.'
        );
      }

      if (response.status === 429) {
        throw new Error(
          data?.message ||
          'The AI model service is currently rate limited. Please wait 10-15 seconds and try again.'
        );
      }

      if (response.status === 400) {
        throw new Error(data?.message || 'The error log could not be processed. Please check the input.');
      }

      throw new Error(
        data?.message || `AI diagnosis request failed with status code ${response.status}.`
      );
    }

    if (!data || !data.title) {
      throw new Error('Received an invalid response format from the AI model service.');
    }

    return data as DiagnosticResult;
  }

  /**
   * Follow-up mentoring chat conversation
   */
  public async respondToChat(
    userMessage: string,
    currentDiagnosis: DiagnosticResult,
    conversationHistory: ChatMessage[]
  ): Promise<string> {
    const trimmed = userMessage.trim();
    if (!trimmed) {
      throw new Error('Message cannot be empty.');
    }

    // Check if external AWS backend is configured
    if (bedrockAdapter.isLiveBackendEnabled()) {
      const awsChatReply = await bedrockAdapter.sendChatViaLambda({
        diagnosticContext: currentDiagnosis,
        conversationHistory,
        userMessage: trimmed,
      });
      if (awsChatReply) {
        return awsChatReply;
      }
    }

    const endpoint = '/api/chat';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: trimmed,
        diagnosticContext: currentDiagnosis,
        conversationHistory,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error('Chat is unavailable: GEMINI_API_KEY is not configured in the server environment.');
      }
      if (response.status === 429) {
        throw new Error('Rate limit reached on chat. Please wait a moment before sending another message.');
      }
      throw new Error(data?.message || `Chat failed with status ${response.status}`);
    }

    return data?.reply || "I'm here to help! Could you clarify your question?";
  }
}

export const diagnosticService = new DiagnosticService();
