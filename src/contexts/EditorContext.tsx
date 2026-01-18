'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Project, FileNode, EditorTab } from '@/types';

interface EditorContextType {
  // Project state
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  
  // Files state
  files: FileNode[];
  setFiles: (files: FileNode[]) => void;
  selectedFile: FileNode | null;
  setSelectedFile: (file: FileNode | null) => void;
  
  // Tabs state
  tabs: EditorTab[];
  activeTabId: string | null;
  openFile: (file: FileNode) => Promise<void>;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveFile: (tabId: string) => Promise<void>;
  
  // UI state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isPreviewOpen: boolean;
  togglePreview: () => void;
  isAIOpen: boolean;
  toggleAI: () => void;
  
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  // Project state
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  // Files state
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  
  // Tabs state
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  
  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Open a file in a new tab or focus existing tab
  const openFile = useCallback(async (file: FileNode) => {
    if (file.type === 'FOLDER') return;

    // Check if tab already exists
    const existingTab = tabs.find(t => t.fileId === file.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      setSelectedFile(file);
      return;
    }

    // Fetch file content
    try {
      const response = await fetch(`/api/files/${file.id}`);
      if (!response.ok) throw new Error('Failed to load file');
      
      const data = await response.json();
      
      const newTab: EditorTab = {
        id: `tab-${Date.now()}`,
        fileId: file.id,
        name: file.name,
        path: file.path,
        content: data.file.content || '',
        extension: file.extension,
        isDirty: false,
        isActive: true,
      };

      setTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
      setActiveTabId(newTab.id);
      setSelectedFile(file);
    } catch (error) {
      console.error('Error opening file:', error);
    }
  }, [tabs]);

  // Close a tab
  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const index = prev.findIndex(t => t.id === tabId);
      const newTabs = prev.filter(t => t.id !== tabId);
      
      // If closing active tab, activate another
      if (activeTabId === tabId && newTabs.length > 0) {
        const newActiveIndex = Math.min(index, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
        setSelectedFile(null);
      }
      
      return newTabs;
    });
  }, [activeTabId]);

  // Set active tab
  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    setTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tabId })));
  }, []);

  // Update tab content (mark as dirty)
  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId 
        ? { ...t, content, isDirty: true }
        : t
    ));
  }, []);

  // Save file
  const saveFile = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !tab.isDirty) return;

    try {
      const response = await fetch(`/api/files/${tab.fileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: tab.content }),
      });

      if (!response.ok) throw new Error('Failed to save file');

      setTabs(prev => prev.map(t => 
        t.id === tabId 
          ? { ...t, isDirty: false }
          : t
      ));
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }, [tabs]);

  // UI toggles
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const togglePreview = useCallback(() => setIsPreviewOpen(prev => !prev), []);
  const toggleAI = useCallback(() => setIsAIOpen(prev => !prev), []);

  return (
    <EditorContext.Provider
      value={{
        currentProject,
        setCurrentProject,
        files,
        setFiles,
        selectedFile,
        setSelectedFile,
        tabs,
        activeTabId,
        openFile,
        closeTab,
        setActiveTab,
        updateTabContent,
        saveFile,
        isSidebarOpen,
        toggleSidebar,
        isPreviewOpen,
        togglePreview,
        isAIOpen,
        toggleAI,
        theme,
        setTheme,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
