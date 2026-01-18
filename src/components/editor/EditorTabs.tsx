'use client';

import React from 'react';
import { X, Circle } from 'lucide-react';
import { cn, getFileIcon } from '@/lib/utils';
import { useEditor } from '@/contexts/EditorContext';

export function EditorTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab, saveFile } = useEditor();

  if (tabs.length === 0) {
    return null;
  }

  const handleClose = async (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isDirty) {
      const shouldSave = confirm('Save changes before closing?');
      if (shouldSave) {
        await saveFile(tabId);
      }
    }
    
    closeTab(tabId);
  };

  return (
    <div className="flex items-center bg-gray-900 border-b border-gray-800 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-gray-800',
            'hover:bg-gray-800/50 transition-colors min-w-0 max-w-[200px] group',
            tab.id === activeTabId
              ? 'bg-gray-800 border-t-2 border-t-blue-500'
              : 'border-t-2 border-t-transparent'
          )}
        >
          {/* File icon */}
          <span className="text-xs flex-shrink-0">
            {getFileIcon(tab.extension)}
          </span>

          {/* File name */}
          <span className="text-sm truncate text-gray-300">
            {tab.name}
          </span>

          {/* Dirty indicator or close button */}
          <button
            onClick={(e) => handleClose(e, tab.id)}
            className={cn(
              'flex-shrink-0 p-0.5 rounded hover:bg-gray-700 transition-colors',
              'opacity-0 group-hover:opacity-100',
              tab.isDirty && 'opacity-100'
            )}
          >
            {tab.isDirty ? (
              <Circle size={10} className="text-blue-400 fill-blue-400" />
            ) : (
              <X size={14} className="text-gray-400" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
