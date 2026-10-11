import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExampleSelector } from './components/ExampleSelector';
import { ErrorInputArea } from './components/ErrorInputArea';
import { DiagnosticLoading } from './components/DiagnosticLoading';
import { DiagnosisResult as DiagnosisResultView } from './components/DiagnosisResult';
import { FollowUpChat } from './components/FollowUpChat';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ArchitectureModal } from './components/ArchitectureModal';
import { diagnosticService } from './services/diagnosticService';
import { DiagnosticResult, ChatMessage, ExampleError } from './types/diagnosis';
import { Terminal, Shield, Zap, Sparkles, AlertCircle, ArrowDown } from 'lucide-react';

export default function App() {
  const [logText, setLogText] = useState('');
  const [selectedExampleId, setSelectedExampleId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing error log...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosticResult | null>(null);
  const [history, setHistory] = useState<DiagnosticResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);

  // Follow-up chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('deploybuddy_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not read history from localStorage');
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (item: DiagnosticResult) => {
    setHistory(prev => {
      // filter out duplicates by title & timestamp
      const filtered = prev.filter(h => h.title !== item.title || (Date.now() - h.timestamp > 60000));
      const updated = [item, ...filtered].slice(0, 20);
      try {
        localStorage.setItem('deploybuddy_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('deploybuddy_history');
    } catch (e) {}
  };

  // Handle example selection
  const handleSelectExample = (example: ExampleError) => {
    setLogText(example.snippet);
    setSelectedExampleId(example.id);
    setValidationError(null);
    setCurrentDiagnosis(null);

    // Scroll smoothly to the error log editor so the user sees the loaded error log
    setTimeout(() => {
      const editor = document.getElementById('error-log-editor');
      if (editor) {
        editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const textarea = document.getElementById('error-log-textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
      }
    }, 50);
  };

  // Run Diagnosis
  const handleDiagnose = async () => {
    const trimmed = logText.trim();
    if (!trimmed) {
      setValidationError('Please paste an error log or select one of the quick examples above.');
      return;
    }

    if (trimmed.length < 15) {
      setValidationError('This error log looks too short to diagnose accurately. Please paste the full terminal output or stack trace.');
      return;
    }

    setValidationError(null);
    setIsLoading(true);
    setLoadingProgress(10);
    setLoadingMessage('Initializing diagnostic engine...');

    try {
      const result = await diagnosticService.diagnose(trimmed, {
        onProgress: (msg, pct) => {
          setLoadingMessage(msg);
          setLoadingProgress(pct);
        }
      });

      setCurrentDiagnosis(result);
      saveToHistory(result);

      // Initialize chat with friendly greeting
      setChatMessages([
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          content: `Hi there! 👋 I've diagnosed your **${result.title}** error above.\n\nTake a look at the suggested fix and commands. If anything looks unfamiliar or if you run into any permission issues while executing them, just ask me below!`,
          timestamp: Date.now()
        }
      ]);

      // Scroll smoothly to diagnosis
      setTimeout(() => {
        const el = document.getElementById('diagnosis-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (err: any) {
      setValidationError(err.message || 'An error occurred during diagnosis. Please check the log and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Chat Send
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsSendingChat(true);

    try {
      if (currentDiagnosis) {
        const replyText = await diagnosticService.respondToChat(text, currentDiagnosis, chatMessages);
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: replyText,
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, botMsg]);
      } else {
        const botMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: "Please diagnose an error log first so I can give you advice tailored specifically to your stack!",
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        content: "Sorry, I had a momentary hiccup processing that question. Please try asking again!",
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Reset diagnosis
  const handleReset = () => {
    setCurrentDiagnosis(null);
    setLogText('');
    setSelectedExampleId(undefined);
    setValidationError(null);
    setChatMessages([]);
  };

  const handleScrollToChat = () => {
    const el = document.getElementById('follow-up-chat');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Navigation */}
      <Header
        historyCount={history.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onReset={handleReset}
        hasActiveDiagnosis={Boolean(currentDiagnosis)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Hero & Value Props */}
        <div className="mb-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Built for early-career developers & students</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Stop Staring at Cryptic Error Logs.
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400 leading-relaxed">
            Paste terminal crash outputs, Spring Boot failures, Docker daemon errors, or CI/CD logs.
            Get clear plain-English explanations, copy-paste terminal commands, and jargon busters.
          </p>

          {/* Quick Pillars */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="flex items-center">
              <Zap className="w-3.5 h-3.5 text-amber-400 mr-1" />
              Instant Diagnosis
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center">
              <Terminal className="w-3.5 h-3.5 text-blue-400 mr-1" />
              One-Click Safe Commands
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center">
              <Shield className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              Beginner Jargon Busters
            </span>
          </div>
        </div>

        {/* Quick Example Selector */}
        <div className="mb-6">
          <ExampleSelector
            onSelectExample={handleSelectExample}
            selectedId={selectedExampleId}
          />
        </div>

        {/* Log Input Area */}
        <div className="mb-6">
          <ErrorInputArea
            log={logText}
            onChangeLog={(val) => {
              setLogText(val);
              if (selectedExampleId) setSelectedExampleId(undefined);
              if (validationError) setValidationError(null);
            }}
            onDiagnose={handleDiagnose}
            onClear={() => {
              setLogText('');
              setSelectedExampleId(undefined);
              setValidationError(null);
            }}
            isLoading={isLoading}
            validationError={validationError}
          />
        </div>

        {/* Live Loading Feedback */}
        {isLoading && (
          <DiagnosticLoading
            currentMessage={loadingMessage}
            progressPercentage={loadingProgress}
          />
        )}

        {/* Diagnosis Result View */}
        {currentDiagnosis && !isLoading && (
          <div id="diagnosis-section" className="scroll-mt-20">
            <DiagnosisResultView
              result={currentDiagnosis}
              onReset={handleReset}
              onScrollToChat={handleScrollToChat}
            />

            {/* Follow-Up Chat */}
            <FollowUpChat
              diagnosis={currentDiagnosis}
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isSending={isSendingChat}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0a0f1c] py-6 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">DeployBuddy AI</span>
            <span>—</span>
            <span>Friendly troubleshooting assistant for beginner engineers</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="hover:text-blue-400 transition-colors cursor-pointer text-slate-400"
            >
              AWS Lambda & Bedrock Reference Architecture
            </button>
            <span>•</span>
            <span className="text-slate-500">
              Reference Architecture (Zero Secrets Exposed)
            </span>
          </div>
        </div>
      </footer>

      {/* History Drawer Modal */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={(item) => {
          setCurrentDiagnosis(item);
          setLogText(item.rawSnippet);
          setChatMessages([
            {
              id: `msg-${Date.now()}`,
              sender: 'assistant',
              content: `Restored diagnosis for **${item.title}**. What would you like to clarify?`,
              timestamp: Date.now()
            }
          ]);
          setTimeout(() => {
            const el = document.getElementById('diagnosis-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onClearHistory={handleClearHistory}
      />

      {/* Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
}
