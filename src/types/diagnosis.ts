export type ErrorCategory = 'spring-boot' | 'docker' | 'kubernetes' | 'github-actions' | 'general';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface FixStep {
  step: number;
  title: string;
  detail: string;
  codeSnippet?: string;
}

export interface CommandItem {
  command: string;
  description: string;
  os?: 'any' | 'mac-linux' | 'windows';
  safetyLevel?: 'Safe' | 'Caution' | 'Destructive';
  warning?: string;
}

export interface JargonTerm {
  term: string;
  definition: string;
  analogy?: string;
}

export interface DiagnosticResult {
  id: string;
  title: string;
  category: ErrorCategory;
  categoryLabel: string;
  severity: SeverityLevel;
  confidenceLevel: ConfidenceLevel;
  badgeLabel?: string;

  // Distinguishing facts directly stated in the log from hypotheses
  factsFound: string[];
  hypotheses: string[];

  // Executive Summary
  summary: string;
  whatHappened: string; // backwards compatibility alias for summary

  // Causes
  likelyCauses: string[];
  likelyCause: string; // backwards compatibility alias

  // Step-by-step resolution
  safeTroubleshootingSteps: FixStep[];
  suggestedFix: FixStep[]; // backwards compatibility alias

  // Platform-specific terminal commands
  commands: CommandItem[];

  // Educational insights for beginners
  whyThisWorks: string;
  beginnerTip: string;
  jargonBuster: JargonTerm[];
  preventativeMeasures: string[];

  // Metadata
  rawSnippet: string;
  timestamp: number;
  isAiGenerated?: boolean;
  modelProvider?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: number;
  quickPrompts?: string[];
}

export interface ExampleError {
  id: string;
  name: string;
  category: ErrorCategory;
  categoryLabel: string;
  badge: string;
  description: string;
  snippet: string;
  previewNote: string;
}
