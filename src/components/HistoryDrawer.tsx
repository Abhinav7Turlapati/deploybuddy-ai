import React from 'react';
import { DiagnosticResult } from '../types/diagnosis';
import { X, History, Trash2, ArrowRight, Clock } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: DiagnosticResult[];
  onSelect: (item: DiagnosticResult) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0d1424] border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0f1d]">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-white">Diagnosis History</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-300 font-mono">
              {history.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-950/40 transition-colors"
                title="Clear all history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p>No past diagnoses in this session yet.</p>
              <p className="mt-1 text-slate-600">Past troubleshooting runs will be saved here.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="p-3 bg-[#11192e] hover:bg-[#15223e] border border-slate-800 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {item.categoryLabel}
                  </span>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-300 line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {item.whatHappened}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-blue-400">
                  <span>Restore diagnosis</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
