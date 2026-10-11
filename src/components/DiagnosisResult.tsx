import React, { useState } from 'react';
import { DiagnosticResult } from '../types/diagnosis';
import { TerminalCommands } from './TerminalCommands';
import { copyTextToClipboard } from '../utils/clipboard';
import { 
  AlertCircle, 
  HelpCircle, 
  Wrench, 
  BookOpen, 
  Lightbulb, 
  Share2, 
  Check, 
  MessageSquare, 
  RotateCcw,
  BookMarked,
  ShieldCheck,
  Code,
  CheckCircle2,
  Sparkles,
  SearchCheck,
  Info,
  XCircle
} from 'lucide-react';

interface DiagnosisResultProps {
  result: DiagnosticResult;
  onReset: () => void;
  onScrollToChat: () => void;
}

export const DiagnosisResult: React.FC<DiagnosisResultProps> = ({
  result,
  onReset,
  onScrollToChat
}) => {
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  // Defensive array normalization for resilience against legacy or partial payloads
  const facts = Array.isArray(result.factsFound) ? result.factsFound : [];
  const hypotheses = Array.isArray(result.hypotheses) && result.hypotheses.length > 0
    ? result.hypotheses
    : (Array.isArray(result.likelyCauses) && result.likelyCauses.length > 0
      ? result.likelyCauses
      : (result.likelyCause ? [result.likelyCause] : []));
  const steps = Array.isArray(result.safeTroubleshootingSteps) && result.safeTroubleshootingSteps.length > 0
    ? result.safeTroubleshootingSteps
    : (Array.isArray(result.suggestedFix) ? result.suggestedFix : []);
  const commands = Array.isArray(result.commands) ? result.commands : [];
  const jargonList = Array.isArray(result.jargonBuster) ? result.jargonBuster : [];
  const preventativeList = Array.isArray(result.preventativeMeasures) ? result.preventativeMeasures : [];

  const handleCopyMarkdown = async () => {
    const md = `## 🛠️ DeployBuddy AI Diagnosis: ${result.title || 'Error Analysis'}
**Category:** ${result.categoryLabel || result.category || 'General'} | **Severity:** ${result.severity || 'Medium'} | **Confidence:** ${result.confidenceLevel || 'High'}

### 1. Facts Identified in Log
${facts.length > 0 ? facts.map(f => `• ${f}`).join('\n') : '• Extracted directly from stack trace'}

### 2. Hypotheses & Likely Root Cause
${hypotheses.length > 0 ? hypotheses.map(h => `• ${h}`).join('\n') : (result.likelyCause || 'Under investigation')}

### 3. Summary
${result.summary || result.whatHappened || 'Error identified.'}

### 4. Safe Troubleshooting Steps
${steps.map(s => `${s.step || 1}. **${s.title || 'Step'}**: ${s.detail || ''}`).join('\n')}

### 5. Recommended Terminal Commands
\`\`\`bash
${commands.map(c => `# [${c.os || 'any'}] ${c.description || ''}${c.warning ? ` (Caution: ${c.warning})` : ''}\n${c.command || ''}`).join('\n\n')}
\`\`\`

### 6. Why This Works
${result.whyThisWorks || 'Addresses underlying runtime fault.'}

> 💡 **Beginner Tip:** ${result.beginnerTip || 'Scan stack trace causes first.'}
`;

    const success = await copyTextToClipboard(md);
    if (success) {
      setCopiedMarkdown(true);
      setCopyFailed(false);
      setTimeout(() => setCopiedMarkdown(false), 2200);
    } else {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2500);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/80';
      case 'High':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      case 'Medium':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getConfidenceBadge = (conf?: string) => {
    switch (conf) {
      case 'High':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      case 'Medium':
        return 'bg-sky-950/80 text-sky-300 border-sky-800/80';
      case 'Low':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
    }
  };

  return (
    <div className="bg-[#101728] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden mt-6">
      {/* Top Banner / Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0d1527] to-[#121c33] border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {result.categoryLabel}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getSeverityBadge(result.severity)}`}>
              Severity: {result.severity}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getConfidenceBadge(result.confidenceLevel)}`}>
              Confidence: {result.confidenceLevel || 'High'}
            </span>
            {result.modelProvider && (
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2.5 py-0.5 rounded-full border border-cyan-800/50 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-cyan-400 inline mr-1" />
                <span>{result.modelProvider}</span>
              </span>
            )}
            {result.badgeLabel && (
              <span className="text-xs font-mono text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">
                {result.badgeLabel}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {result.title}
          </h2>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            title="Copy as Markdown for Discord or StackOverflow"
          >
            {copiedMarkdown ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Markdown!</span>
              </>
            ) : copyFailed ? (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">Copy Failed</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            onClick={onScrollToChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask Follow-Up</span>
          </button>

          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            title="Reset Diagnosis"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* FACTS vs HYPOTHESES */}
        {facts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Facts Found directly in Error Log */}
            <div className="bg-[#0b1122] border border-blue-900/50 rounded-xl p-4.5">
              <div className="flex items-center space-x-2 mb-2.5 text-sky-400">
                <SearchCheck className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">
                  Facts Verified in Log
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-mono">
                  Evidence
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {facts.map((fact, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                Extracted directly from error lines, exit codes, and stack trace frames.
              </div>
            </div>

            {/* Hypotheses & Probable Causes */}
            <div className="bg-[#0b1122] border border-indigo-900/50 rounded-xl p-4.5">
              <div className="flex items-center space-x-2 mb-2.5 text-indigo-400">
                <Lightbulb className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Hypotheses & Root Cause Deductions
                </h3>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
                  Deduction
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {hypotheses.map((hypo, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{hypo}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                Reasoned hypotheses based on environment and runtime patterns.
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Executive Summary & Likely Cause */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Summary / What Happened */}
          <div className="bg-[#0b101e] border border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2.5 text-blue-400">
                <AlertCircle className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  1. Executive Summary
                </h3>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">
                {result.summary || result.whatHappened || 'Error identified.'}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>High-level explanation designed for early-career developers</span>
            </div>
          </div>

          {/* Likely Cause */}
          <div className="bg-[#0b101e] border border-slate-800/80 rounded-xl p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2.5 text-indigo-400">
                <HelpCircle className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  2. Primary Cause
                </h3>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed">
                {result.likelyCause || (Array.isArray(result.likelyCauses) && result.likelyCauses.join(' ')) || hypotheses[0] || 'Under investigation.'}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
              <span>Identified from error signatures and runtime state</span>
            </div>
          </div>
        </div>

        {/* Section 3: Safe Troubleshooting Steps */}
        <div className="bg-[#0b101e] border border-slate-800/80 rounded-xl p-5">
          <div className="flex items-center space-x-2 mb-4 text-emerald-400">
            <Wrench className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              3. Safe Troubleshooting Steps (Step-by-Step)
            </h3>
          </div>

          <div className="space-y-3.5">
            {steps.map((step) => (
              <div
                key={step.step || Math.random()}
                className="flex items-start space-x-3 p-3 rounded-lg bg-[#0e1526] border border-slate-800/70"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {step.step || 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-100">
                    {step.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {step.detail}
                  </p>
                  {step.codeSnippet && (
                    <div className="mt-2.5 p-2.5 bg-[#070b14] rounded-md border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre">
                      {step.codeSnippet}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Platform-Specific Commands to Try */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sky-400">
              <Code className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                4. Platform-Specific Commands
              </h3>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-400">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Commands are never executed automatically</span>
            </div>
          </div>
          <TerminalCommands commands={commands} />
        </div>

        {/* Section 5: Why This Works */}
        <div className="bg-[#0b101e] border border-blue-900/30 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center space-x-2 mb-3 text-cyan-400">
            <BookOpen className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              5. Why This Works (Under the Hood)
            </h3>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">
            {result.whyThisWorks || 'Addresses underlying runtime fault.'}
          </p>

          {/* Beginner Tip highlight box */}
          {result.beginnerTip && (
            <div className="mt-4 p-3.5 rounded-lg bg-blue-950/40 border border-blue-500/30 flex items-start space-x-3">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-amber-300">Senior Mentor Tip: </span>
                <span className="text-xs text-slate-200 leading-relaxed">{result.beginnerTip}</span>
              </div>
            </div>
          )}
        </div>

        {/* Jargon Buster */}
        {jargonList.length > 0 && (
          <div className="bg-[#0b101e] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center space-x-2 mb-3 text-purple-400">
              <BookMarked className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                DevOps Jargon Buster
              </h3>
              <span className="text-[11px] text-slate-400">
                (demystifying technical terms)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {jargonList.map((jargon, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#0d1424] rounded-lg border border-slate-800 text-xs"
                >
                  <div className="font-bold text-slate-100 flex items-center justify-between mb-1">
                    <span className="text-purple-300">{jargon.term}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Glossary</span>
                  </div>
                  <p className="text-slate-300 text-xs mb-1.5">{jargon.definition}</p>
                  {jargon.analogy && (
                    <div className="p-1.5 bg-slate-900/80 rounded text-[11px] text-purple-200/90 italic border border-purple-900/30">
                      💡 {jargon.analogy}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preventative Measures Checklist */}
        {preventativeList.length > 0 && (
          <div className="bg-[#0d1424]/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200">How to prevent this in the future: </span>
                <span className="text-slate-400">
                  {preventativeList.join(' • ')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
