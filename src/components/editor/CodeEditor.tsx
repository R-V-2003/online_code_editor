'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useEditor } from '@/contexts/EditorContext';
import { getEditorLanguage, debounce } from '@/lib/utils';

interface CodeEditorProps {
  onSave?: () => void;
}

export function CodeEditor({ onSave }: CodeEditorProps) {
  const { tabs, activeTabId, updateTabContent, saveFile, theme } = useEditor();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeTabId) {
        saveFile(activeTabId);
        onSave?.();
      }
    });

    // Focus editor
    editor.focus();
  };

  // Debounced content update
  const debouncedUpdate = useCallback(
    debounce((tabId: string, value: string) => {
      updateTabContent(tabId, value);
    }, 300),
    [updateTabContent]
  );

  // Handle content change
  const handleChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      debouncedUpdate(activeTabId, value);
    }
  };

  // Update editor when active tab changes
  useEffect(() => {
    if (editorRef.current && activeTab) {
      const model = editorRef.current.getModel();
      if (model) {
        const currentValue = model.getValue();
        if (currentValue !== activeTab.content) {
          model.setValue(activeTab.content);
        }
      }
    }
  }, [activeTabId, activeTab?.content]);

  if (!activeTab) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">{'</>'}</div>
          <p className="text-lg">Select a file to start editing</p>
          <p className="text-sm mt-2 text-gray-600">
            Use the file explorer on the left to open files
          </p>
        </div>
      </div>
    );
  }

  const language = getEditorLanguage(activeTab.extension);

  return (
    <Editor
      height="100%"
      language={language}
      value={activeTab.content}
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      onChange={handleChange}
      onMount={handleEditorDidMount}
      options={{
        fontSize: 14,
        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: true, scale: 1 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        padding: { top: 16 },
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          indentation: true,
        },
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
      }}
      loading={
        <div className="h-full flex items-center justify-center bg-gray-900">
          <div className="animate-pulse text-gray-500">Loading editor...</div>
        </div>
      }
    />
  );
}
