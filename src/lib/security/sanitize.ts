import DOMPurify from 'isomorphic-dompurify';

/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    WHOLE_DOCUMENT: true,
    RETURN_DOM_FRAGMENT: false,
    ADD_TAGS: ['style', 'link'],
    ADD_ATTR: ['target', 'rel'],
  });
}

/**
 * Sanitize plain text (remove HTML)
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
  
  // Limit length
  sanitized = sanitized.slice(0, 255);
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');
  
  return sanitized || 'unnamed';
}

/**
 * Sanitize file path
 */
export function sanitizePath(path: string): string {
  // Normalize path separators
  let sanitized = path.replace(/\\/g, '/');
  
  // Remove path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  
  // Remove multiple slashes
  sanitized = sanitized.replace(/\/+/g, '/');
  
  // Ensure starts with /
  if (!sanitized.startsWith('/')) {
    sanitized = '/' + sanitized;
  }
  
  // Remove trailing slash (unless root)
  if (sanitized !== '/' && sanitized.endsWith('/')) {
    sanitized = sanitized.slice(0, -1);
  }
  
  return sanitized;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (password.length > 100) {
    errors.push('Password must be less than 100 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain a number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if file extension is allowed
 */
export function isAllowedExtension(filename: string): boolean {
  const allowedExtensions = (process.env.ALLOWED_EXTENSIONS || '.html,.css,.js,.json,.md,.ts,.tsx,.py,.jsx')
    .split(',')
    .map(ext => ext.trim().toLowerCase());
  
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return allowedExtensions.includes(ext);
}

/**
 * Escape special characters for safe logging
 */
export function escapeForLog(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
