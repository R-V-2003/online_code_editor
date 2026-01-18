import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get file icon based on extension
 */
export function getFileIcon(extension: string | null): string {
  const icons: Record<string, string> = {
    '.html': '🌐',
    '.css': '🎨',
    '.js': '📜',
    '.jsx': '⚛️',
    '.ts': '📘',
    '.tsx': '⚛️',
    '.json': '📋',
    '.md': '📝',
    '.py': '🐍',
    '.folder': '📁',
  };

  return icons[extension || ''] || '📄';
}

/**
 * Get Monaco Editor language from extension
 */
export function getEditorLanguage(extension: string | null): string {
  const languages: Record<string, string> = {
    '.html': 'html',
    '.css': 'css',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.json': 'json',
    '.md': 'markdown',
    '.py': 'python',
  };

  return languages[extension || ''] || 'plaintext';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
