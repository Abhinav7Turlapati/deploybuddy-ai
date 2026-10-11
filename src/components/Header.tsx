import React, { useState, useEffect } from 'react';
import { Terminal, ShieldCheck, History, Cpu, RotateCcw } from 'lucide-react';

interface HeaderProps {
  historyCount: number;
  onOpenHistory: () => void;
  onOpenArchitecture: () => void;
  onReset: () => void;
  hasActiveDiagnosis: boolean;
}

type ProviderStatusState = 'checking' | 'gemini-configured' | 'aws-configured' | 'not-configured';

export const Header: React.FC<HeaderProps> = ({
  historyCount,
  onOpenHistory,
  onOpenArchitecture,
  onReset,
  hasActiveDiagnosis
}) => {
  const [providerState, setProviderState] = useState<ProviderStatusState>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('Checking AI provider configuration...');

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) {
          if (isMounted) {
            setProviderState('not-configured');
            setStatusMessage('Status check endpoint returned an error.');
          }
          return;
        }
        const data = await res.json();
        if (!isMounted) return;

        if (data.configured) {
          if (data.provider === 'gemini') {
            setProviderState('gemini-configured');
            setStatusMessage(`Gemini configured (${data.model || 'gemini-3.8-flash'}) in server environment.`);
          } else if (data.provider === 'aws') {
            setProviderState('aws-configured');
            setStatusMessage('External AWS Lambda API endpoint configured via environment variable.');
          } else {
            setProviderState('not-configured');
            setStatusMessage(data.message || 'No AI model provider is configured.');
          }
        } else {
          setProviderState('not-configured');
          setStatusMessage(data.message || 'GEMINI_API_KEY is missing from server secrets.');
        }
      } catch (err) {
        if (isMounted) {
          setProviderState('not-configured');
          setStatusMessage('Could not reach /api/status. Backend may be starting or offline.');
        }
      }
    };

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const renderStatusBadge = () => {
    switch (providerState) {
      case 'gemini-configured':
        return (
          <span
            className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
            title={statusMessage}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Gemini configured</span>
          </span>
        );
      case 'aws-configured':
        return (
          <span
            className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20"
            title={statusMessage}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>AWS endpoint configured</span>
          </span>
        );
      case 'not-configured':
        return (
          <span
            className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20"
            title={statusMessage}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>AI not configured</span>
          </span>
        );
      case 'checking':
      default:
        return (
          <span
            className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700/60"
            title={statusMessage}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
            <span>Checking AI...</span>
          </span>
        );
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">
                DeployBuddy<span className="text-blue-400"> AI</span>
              </span>
              {renderStatusBadge()}
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Beginner-friendly deployment & runtime error troubleshooter
            </p>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenArchitecture}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all cursor-pointer"
            title="View AWS Lambda & Bedrock Reference Architecture"
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">AWS Reference Arch</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all cursor-pointer relative"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {hasActiveDiagnosis && (
            <button
              onClick={onReset}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-rose-300 bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-800/50 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <div className="hidden lg:flex items-center pl-2 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" />
            <span>Zero Secret Exposure</span>
          </div>
        </div>
      </div>
    </header>
  );
};
