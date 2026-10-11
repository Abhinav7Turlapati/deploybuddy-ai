import React, { useRef, useState } from 'react';
import { Terminal, Clipboard, Trash2, Upload, AlertCircle, ArrowRight, Play, Info } from 'lucide-react';

interface ErrorInputAreaProps {
  log: string;
  onChangeLog: (val: string) => void;
  onDiagnose: () => void;
  onClear: () => void;
  isLoading: boolean;
  validationError: string | null;
}

export const ErrorInputArea: React.FC<ErrorInputAreaProps> = ({
  log,
  onChangeLog,
  onDiagnose,
  onClear,
  isLoading,
  validationError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);

  const lineCount = log ? log.split('\n').length : 0;
  const charCount = log.length;

  const handlePasteClipboard = async () => {
    setClipboardNotice(null);
    if (typeof navigator === 'undefined' || !navigator.clipboard || !navigator.clipboard.readText) {
      setClipboardNotice('Direct clipboard read is not permitted by this browser context. Please paste manually using Ctrl+V or Cmd+V.');
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeLog(text);
      } else {
        setClipboardNotice('Clipboard appears to be empty.');
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
      setClipboardNotice('Clipboard access was blocked or denied. Please paste directly into the box using Ctrl+V or Cmd+V.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onChangeLog(content);
        }
      };
      reader.readAsText(file);
    }
    // reset input
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onChangeLog(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading) {
        onDiagnose();
      }
    }
  };

  return (
    <div id="error-log-editor" className="bg-[#101728] border border-slate-800 rounded-xl shadow-lg overflow-hidden scroll-mt-24">
      {/* Top toolbar */}
      <div className="px-4 py-3 bg-[#0d1322] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-xs font-mono font-medium text-slate-300 ml-2">
            raw-error.log
          </span>
          {lineCount > 0 && (
            <span className="text-[11px] font-mono text-slate-500">
              ({lineCount} {lineCount === 1 ? 'line' : 'lines'}, {charCount} chars)
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 transition-colors cursor-pointer"
            title="Paste from clipboard"
          >
            <Clipboard className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Paste Clipboard</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 transition-colors cursor-pointer"
            title="Upload .log or .txt file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Upload Log</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".log,.txt,.json,.out"
            className="hidden"
            onChange={handleFileUpload}
          />

          {log && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-md bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/50 transition-colors cursor-pointer"
              title="Clear editor"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Drag & Drop Editor container */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative transition-colors ${
          isDragging ? 'bg-blue-950/20 ring-2 ring-blue-500 ring-inset' : ''
        }`}
      >
        <textarea
          id="error-log-textarea"
          value={log}
          onChange={(e) => onChangeLog(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Paste your error logs here...
Example from your terminal, Docker run, Kubernetes pod, or GitHub Actions workflow:

  - Spring Boot: Web server failed to start. Port 8080 was already in use.
  - Docker: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
  - Kubernetes: Back-off restarting failed container (Exit Code 137 OOMKilled)
  - GitHub Actions: Process completed with exit code 1 / npm ci failed`}
          rows={10}
          className="w-full bg-[#0b0f19] text-slate-200 p-4 font-mono text-xs sm:text-sm leading-relaxed border-0 focus:outline-none focus:ring-0 resize-y placeholder:text-slate-600 font-normal"
          spellCheck={false}
        />

        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0f19]/90 backdrop-blur-xs pointer-events-none">
            <div className="text-center p-4">
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-bounce" />
              <p className="text-sm font-medium text-slate-200">Drop your .log file here</p>
            </div>
          </div>
        )}
      </div>

      {/* Notices */}
      {clipboardNotice && (
        <div className="mx-4 my-2 p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-start space-x-2 text-amber-300 text-xs">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{clipboardNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setClipboardNotice(null)}
            className="text-amber-400 hover:text-amber-200 text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {validationError && (
        <div className="mx-4 my-3 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg flex items-start space-x-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Notice: </span>
            {validationError}
          </div>
        </div>
      )}

      {/* Bottom Bar: Beginner prompt tip & Diagnose action */}
      <div className="px-4 py-3 bg-[#0d1322] border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong className="text-slate-300">Beginner Tip:</strong> The more lines of the stack trace you paste, the more accurate the diagnosis!
          </span>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">⌘/Ctrl + Enter</kbd>
          </span>

          <button
            type="button"
            disabled={isLoading || !log.trim()}
            onClick={onDiagnose}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md cursor-pointer ${
              isLoading || !log.trim()
                ? 'bg-slate-800 text-slate-500 border border-slate-700/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 hover:shadow-blue-500/40 border border-blue-400/30 transform active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Diagnosing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Diagnose Error</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
