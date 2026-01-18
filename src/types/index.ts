/**
 * Type definitions for Cloud Code Editor
 */

// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
  projectCount?: number;
}

// Project types
export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  language: string;
  framework: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
}

// File types
export type FileType = 'FILE' | 'FOLDER';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: FileType;
  extension: string | null;
  mimeType?: string | null;
  content?: string | null;
  size: number;
  parentId: string | null;
  children?: FileNode[];
  createdAt: string;
  updatedAt: string;
}

// Editor tab
export interface EditorTab {
  id: string;
  fileId: string;
  name: string;
  path: string;
  content: string;
  extension: string | null;
  isDirty: boolean;
  isActive: boolean;
}

// Theme
export type Theme = 'light' | 'dark';

// AI types
export type AIAction = 'explain' | 'fix' | 'generate' | 'refactor';

export interface AIRequest {
  action: AIAction;
  code: string;
  context?: string;
  prompt?: string;
}

export interface AIResponse {
  result: string;
  action: AIAction;
  tokensUsed: number;
}

// Preview types
export interface PreviewMessage {
  type: 'log' | 'error' | 'warn' | 'info';
  content: string;
  timestamp: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}
