'use client';

import React, { useState } from 'react';
import { Sparkles, Wrench, Code, RefreshCw, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useEditor } from '@/contexts/EditorContext';
import { cn } from '@/lib/utils';

type AIAction = 'explain' | 'fix' | 'generate' | 'refactor';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: AIAction;
}

export function AIPanel() {
  const { tabs, activeTabId, isAIOpen, toggleAI } = useEditor();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedAction, setSelectedAction] = useState<AIAction>('explain');

  const activeTab = tabs.find(t => t.id === activeTabId);
  const selectedCode = activeTab?.content || '';

  const actions: { action: AIAction; icon: React.ReactNode; label: string }[] = [
    { action: 'explain', icon: <Sparkles size={14} />, label: 'Explain' },
    { action: 'fix', icon: <Wrench size={14} />, label: 'Fix' },
    { action: 'generate', icon: <Code size={14} />, label: 'Generate' },
    { action: 'refactor', icon: <RefreshCw size={14} />, label: 'Refactor' },
  ];

  const handleSubmit = async () => {
    if (isLoading) return;
    
    // Validate
    if (selectedAction !== 'generate' && !selectedCode) {
      alert('Please open a file first');
      return;
    }
    
    if (selectedAction === 'generate' && !prompt.trim()) {
      alert('Please describe what you want to generate');
      return;
    }

    setIsLoading(true);

    // Add user message
    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: selectedAction === 'generate' 
        ? prompt 
        : `${selectedAction} the code in ${activeTab?.name || 'current file'}`,
      action: selectedAction,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedAction,
          code: selectedCode,
          prompt: prompt || undefined,
          language: activeTab?.extension?.replace('.', '') || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      // Add assistant message
      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: data.result,
        action: selectedAction,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setPrompt('');
    } catch (error) {
      const errorMessage: AIMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAIOpen) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800 w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-sm font-semibold text-gray-200">AI Assistant</span>
        </div>
        <button
          onClick={toggleAI}
          className="p-1 hover:bg-gray-800 rounded"
        >
          <X size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1 p-2 border-b border-gray-800">
        {actions.map(({ action, icon, label }) => (
          <button
            key={action}
            onClick={() => setSelectedAction(action)}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors',
              selectedAction === action
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <Sparkles size={32} className="mx-auto mb-3 text-purple-400/50" />
            <p>Select an action and click the button below</p>
            <p className="mt-1 text-xs text-gray-600">
              The AI will analyze your current file
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'rounded-lg p-3 text-sm',
                msg.role === 'user'
                  ? 'bg-purple-600/20 text-purple-200 ml-4'
                  : 'bg-gray-800 text-gray-300 mr-4'
              )}
            >
              {msg.action && (
                <div className="text-xs text-gray-500 mb-1 uppercase">
                  {msg.action}
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">
                {msg.content}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 size={14} className="animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-gray-800">
        {selectedAction === 'generate' && (
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to generate..."
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none mb-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
            rows={3}
          />
        )}
        
        {(selectedAction === 'fix' || selectedAction === 'refactor') && (
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Additional instructions (optional)..."
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 resize-none mb-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
            rows={2}
          />
        )}

        <Button
          onClick={handleSubmit}
          disabled={isLoading || (selectedAction !== 'generate' && !selectedCode)}
          className="w-full"
          variant="primary"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Send size={14} className="mr-2" />
              {selectedAction === 'explain' && 'Explain Code'}
              {selectedAction === 'fix' && 'Fix Bugs'}
              {selectedAction === 'generate' && 'Generate Code'}
              {selectedAction === 'refactor' && 'Refactor Code'}
            </>
          )}
        </Button>

        {!selectedCode && selectedAction !== 'generate' && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Open a file to use this action
          </p>
        )}
      </div>
    </div>
  );
}
