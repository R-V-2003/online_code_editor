'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  Play, 
  Sparkles, 
  Save, 
  Settings, 
  LogOut,
  Moon,
  Sun,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EditorProvider, useEditor } from '@/contexts/EditorContext';
import { FileExplorer } from '@/components/sidebar/FileExplorer';
import { CodeEditor, EditorTabs, LivePreview } from '@/components/editor';
import { AIPanel } from '@/components/ai/AIPanel';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { Project, FileNode } from '@/types';

function EditorContent() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const {
    currentProject,
    setCurrentProject,
    files,
    setFiles,
    tabs,
    activeTabId,
    saveFile,
    isSidebarOpen,
    toggleSidebar,
    isPreviewOpen,
    togglePreview,
    isAIOpen,
    toggleAI,
    theme,
    setTheme,
  } = useEditor();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
        
        // Select first project if none selected
        if (!currentProject && data.projects.length > 0) {
          selectProject(data.projects[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, [currentProject]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated, loadProjects]);

  // Select a project and load its files
  const selectProject = async (project: Project) => {
    setCurrentProject(project);
    setIsProjectMenuOpen(false);

    try {
      const response = await fetch(`/api/projects/${project.id}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
    }
  };

  // Refresh files
  const refreshFiles = async () => {
    if (!currentProject) return;
    
    try {
      const response = await fetch(`/api/projects/${currentProject.id}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to refresh files:', error);
    }
  };

  // Create new project
  const createProject = async () => {
    const name = prompt('Enter project name:');
    if (!name) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const data = await response.json();
        await loadProjects();
        selectProject(data.project);
        toast.success('Project created!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create project');
      }
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  // Save current file
  const handleSave = async () => {
    if (!activeTabId) return;
    
    try {
      await saveFile(activeTabId);
      toast.success('File saved!');
    } catch (error) {
      toast.error('Failed to save file');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={cn('h-screen flex flex-col', theme === 'dark' ? 'dark' : '')}>
      {/* Top Bar */}
      <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-3">
        <div className="flex items-center gap-3">
          {/* Toggle sidebar */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-gray-800 rounded"
          >
            <Menu size={18} className="text-gray-400" />
          </button>

          {/* Project selector */}
          <div className="relative">
            <button
              onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-medium">
                {currentProject?.name || 'Select Project'}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {isProjectMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-2">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => selectProject(project)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm',
                        currentProject?.id === project.id
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-700 text-gray-300'
                      )}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-700 p-2">
                  <button
                    onClick={createProject}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg text-sm text-gray-300"
                  >
                    <Plus size={14} />
                    New Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleSave} title="Save (Ctrl+S)">
            <Save size={16} />
          </Button>
          
          <Button
            size="sm"
            variant={isPreviewOpen ? 'primary' : 'ghost'}
            onClick={togglePreview}
            title="Toggle Preview"
          >
            <Play size={16} />
          </Button>
          
          <Button
            size="sm"
            variant={isAIOpen ? 'primary' : 'ghost'}
            onClick={toggleAI}
            title="AI Assistant"
          >
            <Sparkles size={16} />
          </Button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 hover:bg-gray-800 rounded"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={16} className="text-gray-400" />
            ) : (
              <Moon size={16} className="text-gray-400" />
            )}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-medium"
            >
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </button>

            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-gray-700">
                  <p className="font-medium text-sm">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg text-sm text-red-400"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {isSidebarOpen && (
          <aside className="w-64 flex-shrink-0 border-r border-gray-800">
            <FileExplorer files={files} onRefresh={refreshFiles} />
          </aside>
        )}

        {/* Editor Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <EditorTabs />
          <div className="flex-1 overflow-hidden">
            <CodeEditor onSave={handleSave} />
          </div>
        </main>

        {/* Preview Panel */}
        {isPreviewOpen && (
          <aside className="w-1/3 min-w-[300px] flex-shrink-0">
            <LivePreview />
          </aside>
        )}

        {/* AI Panel */}
        {isAIOpen && <AIPanel />}
      </div>

      {/* Status Bar */}
      <footer className="h-6 bg-blue-600 px-3 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-4">
          <span>{currentProject?.language || 'JavaScript'}</span>
          {tabs.find(t => t.id === activeTabId) && (
            <span>{tabs.find(t => t.id === activeTabId)?.path}</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Ln 1, Col 1</span>
          <span>UTF-8</span>
        </div>
      </footer>

      {/* Click outside handlers */}
      {(isProjectMenuOpen || isUserMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProjectMenuOpen(false);
            setIsUserMenuOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <EditorProvider>
      <EditorContent />
    </EditorProvider>
  );
}
