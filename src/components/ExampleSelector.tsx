import React, { useState } from 'react';
import { EXAMPLE_ERRORS } from '../data/exampleErrors';
import { ExampleError, ErrorCategory } from '../types/diagnosis';
import { Sparkles, Layers, Box, Cpu, GitBranch, ChevronDown } from 'lucide-react';

interface ExampleSelectorProps {
  onSelectExample: (example: ExampleError) => void;
  selectedId?: string;
}

export const ExampleSelector: React.FC<ExampleSelectorProps> = ({
  onSelectExample,
  selectedId
}) => {
  const [activeCategory, setActiveCategory] = useState<ErrorCategory | 'all'>('all');

  const categories: Array<{ id: ErrorCategory | 'all'; label: string; icon: React.ReactNode }> = [
    { id: 'all', label: 'All Examples', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'spring-boot', label: 'Spring Boot', icon: <Layers className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'docker', label: 'Docker', icon: <Box className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'kubernetes', label: 'Kubernetes', icon: <Cpu className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: 'github-actions', label: 'GitHub Actions', icon: <GitBranch className="w-3.5 h-3.5 text-amber-400" /> },
  ];

  const filteredExamples = activeCategory === 'all'
    ? EXAMPLE_ERRORS
    : EXAMPLE_ERRORS.filter(e => e.category === activeCategory);

  return (
    <div className="bg-[#101728] border border-slate-800/80 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Quick Real-World Examples
          </h3>
          <span className="text-xs text-slate-400 hidden md:inline">
            (click to test instant diagnosis)
          </span>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-blue-600/30 text-blue-200 border border-blue-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/60'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Example cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {filteredExamples.map(example => {
          const isSelected = selectedId === example.id;

          let categoryBadgeColor = 'bg-slate-800 text-slate-300';
          if (example.category === 'spring-boot') categoryBadgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';
          if (example.category === 'docker') categoryBadgeColor = 'bg-blue-950/60 text-blue-300 border-blue-800/50';
          if (example.category === 'kubernetes') categoryBadgeColor = 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50';
          if (example.category === 'github-actions') categoryBadgeColor = 'bg-amber-950/60 text-amber-300 border-amber-800/50';

          return (
            <div
              key={example.id}
              onClick={() => onSelectExample(example)}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30'
                  : 'bg-[#0c1220] hover:bg-[#131d33] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${categoryBadgeColor}`}>
                    {example.categoryLabel}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {example.badge}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors line-clamp-1">
                  {example.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {example.description}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectExample(example);
                }}
                className={`w-full mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-medium transition-colors cursor-pointer group/btn ${
                  isSelected
                    ? 'text-blue-300'
                    : 'text-blue-400 hover:text-blue-300'
                }`}
                aria-label={`Load error log for ${example.name}`}
                data-testid={`load-error-log-${example.id}`}
              >
                <span className="flex items-center space-x-1.5">
                  <span>Load error log</span>
                  {isSelected && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">
                      ✓ Loaded
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs group-hover/btn:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
