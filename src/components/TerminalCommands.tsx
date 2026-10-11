import React, { useState } from 'react';
import { CommandItem } from '../types/diagnosis';
import { Terminal, Copy, Check, ShieldCheck, AlertTriangle, ShieldAlert, XCircle } from 'lucide-react';
import { copyTextToClipboard } from '../utils/clipboard';

interface TerminalCommandsProps {
  commands?: CommandItem[];
}

export const TerminalCommands: React.FC<TerminalCommandsProps> = ({ commands = [] }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyFailedIndex, setCopyFailedIndex] = useState<number | null>(null);
  const [filterOS, setFilterOS] = useState<'all' | 'mac-linux' | 'windows'>('all');

  const handleCopy = async (cmd: string, index: number) => {
    const success = await copyTextToClipboard(cmd);
    if (success) {
      setCopiedIndex(index);
      setCopyFailedIndex(null);
      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } else {
      setCopyFailedIndex(index);
      setTimeout(() => {
        setCopyFailedIndex(null);
      }, 2500);
    }
  };

  const safeCommandsList = Array.isArray(commands) ? commands : [];

  const filteredCommands = safeCommandsList.filter(item => {
    if (!item) return false;
    if (filterOS === 'all') return true;
    if (!item.os || item.os === 'any') return true;
    return item.os === filterOS;
  });

  const getSafetyBadge = (level?: 'Safe' | 'Caution' | 'Destructive') => {
    switch (level) {
      case 'Safe':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Safe (Read-Only)</span>
          </span>
        );
      case 'Caution':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Caution (Terminates / Modifies)</span>
          </span>
        );
      case 'Destructive':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>Destructive</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (!commands || commands.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0b101d] border border-slate-800 rounded-xl overflow-hidden shadow-inner">
      {/* Terminal Title Bar */}
      <div className="bg-[#0d1424] px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-200">
            Recommended Terminal Commands
          </span>
        </div>

        {/* OS filter toggle */}
        <div className="flex items-center space-x-1 text-xs">
          <button
            onClick={() => setFilterOS('all')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              filterOS === 'all'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterOS('mac-linux')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              filterOS === 'mac-linux'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            macOS / Linux
          </button>
          <button
            onClick={() => setFilterOS('windows')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              filterOS === 'windows'
                ? 'bg-blue-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Windows
          </button>
        </div>
      </div>

      {/* Command rows */}
      <div className="divide-y divide-slate-800/80 p-2 sm:p-3 space-y-3">
        {filteredCommands.map((item, idx) => (
          <div key={idx} className="pt-2 first:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
              <span className="text-xs text-slate-300 font-medium">
                {item.description}
              </span>
              <div className="flex items-center space-x-2">
                {item.os && item.os !== 'any' && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                    {item.os === 'mac-linux' ? 'macOS/Linux' : 'Windows'}
                  </span>
                )}
                {getSafetyBadge(item.safetyLevel)}
              </div>
            </div>

            {/* Code line with 1-click copy */}
            <div className="relative group bg-[#070b14] border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between font-mono text-xs text-blue-200 hover:border-slate-700 transition-colors">
              <div className="overflow-x-auto whitespace-pre pr-3 select-all">
                <span className="text-slate-500 mr-2">$</span>
                <span className="text-blue-300">{item.command}</span>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(item.command, idx)}
                className={`shrink-0 ml-2 p-1.5 rounded-md border text-xs flex items-center space-x-1 transition-all cursor-pointer ${
                  copiedIndex === idx
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                    : copyFailedIndex === idx
                    ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Copy command"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-sans">Copied!</span>
                  </>
                ) : copyFailedIndex === idx ? (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-[11px] font-sans">Copy Failed</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-sans hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Warning if caution or destructive */}
            {item.warning && (
              <div className="mt-1.5 px-2.5 py-1 rounded bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <span><strong>Caution:</strong> {item.warning}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
