'use client';

import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2, Edit2 } from 'lucide-react';
import { cn, getFileIcon } from '@/lib/utils';
import { FileNode } from '@/types';
import { useEditor } from '@/contexts/EditorContext';

interface FileTreeItemProps {
  node: FileNode;
  level: number;
  onSelect: (node: FileNode) => void;
  onDelete: (node: FileNode) => void;
  onRename: (node: FileNode, newName: string) => void;
}

function FileTreeItem({ node, level, onSelect, onDelete, onRename }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const { selectedFile } = useEditor();

  const isFolder = node.type === 'FOLDER';
  const isSelected = selectedFile?.id === node.id;

  const handleClick = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node);
    }
  };

  const handleRename = () => {
    if (editName.trim() && editName !== node.name) {
      onRename(node, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(node.name);
      setIsEditing(false);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 cursor-pointer text-sm rounded-md group',
          'hover:bg-gray-800/50 transition-colors',
          isSelected && 'bg-blue-600/20 text-blue-400'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {/* Expand/collapse icon for folders */}
        {isFolder ? (
          <span className="w-4 h-4 flex items-center justify-center text-gray-500">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="w-4" />
        )}

        {/* File/Folder icon */}
        <span className="w-4 h-4 flex items-center justify-center text-gray-400">
          {isFolder ? (
            isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />
          ) : (
            <File size={14} />
          )}
        </span>

        {/* Name */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-gray-700 px-1 py-0.5 rounded text-xs outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-gray-300">{node.name}</span>
        )}

        {/* Actions (visible on hover) */}
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <Edit2 size={12} className="text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <Trash2 size={12} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Children */}
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileExplorerProps {
  files: FileNode[];
  onRefresh: () => void;
}

export function FileExplorer({ files, onRefresh }: FileExplorerProps) {
  const { currentProject, openFile } = useEditor();
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');

  const handleSelect = useCallback((node: FileNode) => {
    openFile(node);
  }, [openFile]);

  const handleDelete = useCallback(async (node: FileNode) => {
    if (!confirm(`Are you sure you want to delete "${node.name}"?`)) return;

    try {
      const response = await fetch(`/api/files/${node.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }, [onRefresh]);

  const handleRename = useCallback(async (node: FileNode, newName: string) => {
    try {
      const response = await fetch(`/api/files/${node.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to rename file:', error);
    }
  }, [onRefresh]);

  const handleCreate = async () => {
    if (!newName.trim() || !currentProject) return;

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          name: newName.trim(),
          type: isCreating === 'folder' ? 'FOLDER' : 'FILE',
          content: isCreating === 'file' ? '' : undefined,
        }),
      });

      if (response.ok) {
        setNewName('');
        setIsCreating(null);
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setNewName('');
      setIsCreating(null);
    }
  };

  // Build tree structure from flat files
  const buildTree = (files: FileNode[]): FileNode[] => {
    const nodeMap = new Map<string, FileNode>();
    const rootNodes: FileNode[] = [];

    // Create nodes with children array
    files.forEach(file => {
      nodeMap.set(file.id, { ...file, children: file.type === 'FOLDER' ? [] : undefined });
    });

    // Build tree
    files.forEach(file => {
      const node = nodeMap.get(file.id)!;
      if (file.parentId && nodeMap.has(file.parentId)) {
        const parent = nodeMap.get(file.parentId)!;
        parent.children?.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Sort: folders first, then alphabetically
    const sortNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'FOLDER' ? -1 : 1;
        return a.name.localeCompare(b.name);
      }).map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }));
    };

    return sortNodes(rootNodes);
  };

  const treeFiles = buildTree(files);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating('file')}
            className="p-1 hover:bg-gray-800 rounded"
            title="New File"
          >
            <Plus size={14} className="text-gray-400" />
          </button>
          <button
            onClick={() => setIsCreating('folder')}
            className="p-1 hover:bg-gray-800 rounded"
            title="New Folder"
          >
            <Folder size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Project Name */}
      {currentProject && (
        <div className="px-3 py-2 border-b border-gray-800">
          <span className="text-sm font-medium text-gray-200">{currentProject.name}</span>
        </div>
      )}

      {/* New file/folder input */}
      {isCreating && (
        <div className="px-3 py-2 border-b border-gray-800">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={() => {
              if (!newName.trim()) setIsCreating(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isCreating === 'folder' ? 'Folder name...' : 'File name...'}
            className="w-full bg-gray-800 px-2 py-1 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-auto py-2">
        {treeFiles.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            No files yet. Create your first file!
          </div>
        ) : (
          treeFiles.map((node) => (
            <FileTreeItem
              key={node.id}
              node={node}
              level={0}
              onSelect={handleSelect}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))
        )}
      </div>
    </div>
  );
}
