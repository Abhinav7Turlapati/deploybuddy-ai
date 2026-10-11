import React, { useState } from 'react';
import { X, Cpu, ShieldCheck, Check, Copy, Server, ArrowRight, Layers, XCircle } from 'lucide-react';
import { copyTextToClipboard } from '../utils/clipboard';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  if (!isOpen) return null;

  const lambdaCodeSample = `// lambda/diagnose.ts - Production AWS Lambda + Amazon Bedrock Handler
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });

export const handler = async (event: any) => {
  const { errorLog } = JSON.parse(event.body || "{}");
  
  const systemPrompt = \`You are DeployBuddy AI, a senior developer mentor for beginners.
Analyze the error log and return structured JSON matching:
{
  "title": string,
  "category": "spring-boot" | "docker" | "kubernetes" | "github-actions" | "general",
  "categoryLabel": string,
  "severity": "Low" | "Medium" | "High" | "Critical",
  "confidenceLevel": "High" | "Medium" | "Low",
  "summary": string,
  "factsFound": string[],
  "hypotheses": string[],
  "likelyCauses": string[],
  "safeTroubleshootingSteps": [{"step": number, "title": string, "detail": string, "codeSnippet"?: string}],
  "commands": [{"command": string, "description": string, "os": "mac-linux" | "windows" | "any", "safetyLevel": "Safe" | "Caution" | "Destructive", "warning"?: string}],
  "whyThisWorks": string,
  "beginnerTip": string,
  "jargonBuster": [{"term": string, "definition": string, "analogy": string}]
}\`;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2500,
    system: systemPrompt,
    messages: [{ role: "user", content: errorLog }]
  };

  const response = await bedrock.send(new InvokeModelCommand({
    modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload)
  }));

  const result = JSON.parse(new TextDecoder().decode(response.body));
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: result.content[0].text
  };
};`;

  const copyLambdaCode = async () => {
    const success = await copyTextToClipboard(lambdaCodeSample);
    if (success) {
      setCopiedCode(true);
      setCopyFailed(false);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#0a0f1d] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                AWS Lambda + Amazon Bedrock Reference Architecture
              </h3>
              <p className="text-xs text-slate-400">
                Reference design for deploying with AWS API Gateway & Bedrock (Requires external AWS setup)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-slate-300">
          {/* Architecture Pipeline Diagram */}
          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-2.5">
              1. Production Request Flow
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="p-3 rounded-lg bg-[#11192e] border border-slate-800 text-center">
                <span className="font-bold text-blue-400 block mb-1">React Frontend</span>
                <span className="text-[11px] text-slate-400">Zero AWS keys stored in browser</span>
              </div>
              <div className="p-3 rounded-lg bg-[#11192e] border border-slate-800 text-center flex flex-col items-center justify-center">
                <span className="font-bold text-indigo-400 block mb-1">API Gateway</span>
                <span className="text-[11px] text-slate-400">Rate limiting & CORS proxy</span>
              </div>
              <div className="p-3 rounded-lg bg-[#11192e] border border-slate-800 text-center">
                <span className="font-bold text-sky-400 block mb-1">AWS Lambda</span>
                <span className="text-[11px] text-slate-400">IAM Role execution (No secrets)</span>
              </div>
              <div className="p-3 rounded-lg bg-[#11192e] border border-slate-800 text-center">
                <span className="font-bold text-emerald-400 block mb-1">Amazon Bedrock</span>
                <span className="text-[11px] text-slate-400">Claude 3.5 Sonnet / Titan</span>
              </div>
            </div>
          </div>

          {/* Key Security Principles */}
          <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-blue-300 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Secret Frontend Guarantees</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-[11px]">
              <li>No <code className="text-blue-300">AWS_ACCESS_KEY_ID</code> or secrets ever exist in frontend client code.</li>
              <li>Diagnosis logic is decoupled into <code className="text-blue-300">src/services/diagnosticService.ts</code> calling secure backend endpoints.</li>
              <li>To route directly to an AWS Bedrock Lambda endpoint, configure <code className="text-blue-300">VITE_AWS_API_URL</code> or <code className="text-blue-300">VITE_LAMBDA_API_URL</code>.</li>
            </ul>
          </div>

          {/* Sample Lambda Handler */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
                <Server className="w-4 h-4 text-blue-400" />
                <span>Ready-to-Deploy AWS Lambda Handler</span>
              </h4>
              <button
                onClick={copyLambdaCode}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] text-emerald-400">Copied!</span>
                  </>
                ) : copyFailed ? (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px] text-rose-400">Copy Failed</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy Handler</span>
                  </>
                )}
              </button>
            </div>
            <pre className="bg-[#090d18] border border-slate-800 rounded-lg p-3 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed max-h-56">
              {lambdaCodeSample}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a0f1d] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
