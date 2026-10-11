import React from 'react';
import { Cpu, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface DiagnosticLoadingProps {
  currentMessage: string;
  progressPercentage: number;
}

export const DiagnosticLoading: React.FC<DiagnosticLoadingProps> = ({
  currentMessage,
  progressPercentage
}) => {
  const phases = [
    { label: 'Parse & filter noise from stack trace', threshold: 25 },
    { label: 'Detect runtime framework (Spring/Docker/K8s/CI)', threshold: 50 },
    { label: 'Isolate root failure & trap signatures', threshold: 75 },
    { label: 'Synthesize beginner-friendly steps & safe terminal commands', threshold: 95 }
  ];

  return (
    <div className="bg-[#101728] border border-blue-500/30 rounded-xl p-6 shadow-xl relative overflow-hidden my-6">
      {/* Background glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
          <Cpu className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-100">
              DeployBuddy is Analyzing Your Log
            </h3>
            <span className="flex items-center text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 mr-1" />
              Scanning
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Breaking down cryptic messages into plain English solutions
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
          <span className="text-blue-300 font-medium">{currentMessage || 'Inspecting logs...'}</span>
          <span className="text-slate-400">{progressPercentage}%</span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
        {phases.map((p, i) => {
          const isDone = progressPercentage >= p.threshold;
          const isCurrent = progressPercentage < p.threshold && (i === 0 || progressPercentage >= phases[i - 1].threshold);

          return (
            <div
              key={i}
              className={`flex items-center space-x-2.5 p-2 rounded-lg text-xs transition-colors border ${
                isDone
                  ? 'bg-slate-900/60 border-emerald-900/40 text-slate-300'
                  : isCurrent
                  ? 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                  : 'bg-slate-900/20 border-slate-800/40 text-slate-500'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
              )}
              <span className="truncate">{p.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
