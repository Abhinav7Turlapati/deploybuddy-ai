/**
 * DeployBuddy AI - AWS Lambda & Amazon Bedrock Integration Adapter
 * 
 * ARCHITECTURE OVERVIEW:
 * ---------------------
 * In production, the React frontend talks to an AWS API Gateway HTTP API,
 * which routes to an AWS Lambda function running in Node.js/Python.
 * The Lambda function uses the AWS SDK (@aws-sdk/client-bedrock-runtime)
 * with an IAM execution role (AmazonBedrockFullAccess or scoped invoke permissions).
 * 
 * CRITICAL SECURITY PRINCIPLE:
 * Frontend code NEVER stores or references AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY.
 * All Bedrock calls are proxied through the authenticated backend.
 * 
 * BEDROCK MODEL CONFIGURATION:
 * - Recommended Model ID: anthropic.claude-3-5-sonnet-20241022-v2:0 (or amazon.titan-text-premier-v1:0)
 * - System Prompt: Tailored as an empathetic, senior developer mentor for beginners.
 */

import { DiagnosticResult, ChatMessage } from '../types/diagnosis';

export interface BedrockDiagnosticRequest {
  errorLog: string;
  context?: {
    framework?: string;
    operatingSystem?: string;
    environment?: 'local' | 'docker' | 'kubernetes' | 'ci-cd';
  };
}

export interface BedrockChatRequest {
  diagnosticContext: DiagnosticResult;
  conversationHistory: ChatMessage[];
  userMessage: string;
}

export interface BedrockLambdaConfig {
  apiEndpoint?: string;
  enableLiveBackend?: boolean;
}

function isDiagnosticResult(value: unknown): value is DiagnosticResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Partial<DiagnosticResult>;
  return typeof result.title === 'string' && result.title.trim() !== '';
}

/**
 * BedrockLambdaAdapter
 * Pluggable client adapter that forwards diagnosis requests to an external AWS Lambda
 * API Gateway proxy when VITE_AWS_API_URL or VITE_LAMBDA_API_URL is configured.
 * 
 * NOTE: This client-side adapter does NOT bundle the AWS SDK or invoke Amazon Bedrock directly.
 * When unconfigured, requests are routed to the local Express /api server running Gemini.
 */
export class BedrockLambdaAdapter {
  private apiEndpoint: string;
  private isConfigured: boolean;

  constructor(config?: BedrockLambdaConfig) {
    this.apiEndpoint = config?.apiEndpoint || 
      (import.meta as any).env?.VITE_AWS_API_URL || 
      (import.meta as any).env?.VITE_LAMBDA_API_URL || 
      '';
    this.isConfigured = Boolean(
      config?.enableLiveBackend !== false && this.apiEndpoint && this.apiEndpoint.trim() !== ''
    );
  }

  public isLiveBackendEnabled(): boolean {
    return this.isConfigured;
  }

  public getApiEndpoint(): string {
    return this.apiEndpoint;
  }

  /**
   * Dispatches the error log to the configured external AWS Lambda API endpoint.
   * If unconfigured, returns null so DiagnosticService uses the server's Gemini engine.
   */
  public async diagnoseViaLambda(request: BedrockDiagnosticRequest): Promise<DiagnosticResult | null> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/diagnose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Lambda returned status ${response.status}: ${response.statusText}`);
      }

      const data: unknown = await response.json();
      return isDiagnosticResult(data) ? data : null;
    } catch (err) {
      console.warn('[BedrockLambdaAdapter] External AWS Lambda call failed, falling back to server Gemini engine:', err);
      return null;
    }
  }

  /**
   * Dispatches follow-up chat to the external AWS Lambda API.
   * Returns null if unconfigured or failed so DiagnosticService uses the server's Gemini engine.
   */
  public async sendChatViaLambda(request: BedrockChatRequest): Promise<string | null> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Lambda chat error ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || typeof (data as { reply?: unknown }).reply !== 'string') {
        return null;
      }

      const reply = (data as { reply: string }).reply.trim();
      return reply || null;
    } catch (err) {
      console.warn('[BedrockLambdaAdapter] External chat call failed, falling back to server Gemini engine:', err);
      return null;
    }
  }
}

// Global adapter instance
export const bedrockAdapter = new BedrockLambdaAdapter();
