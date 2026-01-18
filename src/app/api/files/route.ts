import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { requireAuth, isAuthenticated } from '@/lib/auth/middleware';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Files API
 * Handles file CRUD operations
 */

// Allowed file extensions
const ALLOWED_EXTENSIONS = (process.env.ALLOWED_EXTENSIONS || '.html,.css,.js,.json,.md,.ts,.tsx,.py,.jsx')
  .split(',')
  .map(ext => ext.trim().toLowerCase());

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default

/**
 * GET /api/files?projectId=xxx
 * List files in a project
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.user.userId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const files = await prisma.file.findMany({
      where: { projectId },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        path: true,
        type: true,
        extension: true,
        size: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/files
 * Create a new file or folder
 */
const createFileSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(255),
  type: z.enum(['FILE', 'FOLDER']),
  parentPath: z.string().optional(), // Parent folder path
  content: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const body = await request.json();
    const result = createFileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { projectId, name, type, parentPath, content } = result.data;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.user.userId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check file limit
    const fileCount = await prisma.file.count({
      where: { projectId },
    });

    const maxFiles = parseInt(process.env.MAX_FILES_PER_PROJECT || '100');
    if (fileCount >= maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} files per project allowed` },
        { status: 403 }
      );
    }

    // Validate file extension for files
    let extension: string | null = null;
    if (type === 'FILE') {
      const dotIndex = name.lastIndexOf('.');
      if (dotIndex !== -1) {
        extension = name.substring(dotIndex).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(extension)) {
          return NextResponse.json(
            { error: `File extension ${extension} is not allowed` },
            { status: 400 }
          );
        }
      }
    }

    // Build file path
    const basePath = parentPath || '';
    const path = `${basePath}/${name}`.replace(/\/+/g, '/');

    // Check if file already exists
    const existing = await prisma.file.findFirst({
      where: {
        projectId,
        path,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A file with this name already exists' },
        { status: 409 }
      );
    }

    // Find parent folder ID
    let parentId: string | null = null;
    if (parentPath && parentPath !== '/') {
      const parentFolder = await prisma.file.findFirst({
        where: {
          projectId,
          path: parentPath,
          type: 'FOLDER',
        },
      });
      parentId = parentFolder?.id || null;
    }

    // Sanitize content if HTML
    let sanitizedContent = content || '';
    if (extension === '.html' && content) {
      sanitizedContent = DOMPurify.sanitize(content, {
        WHOLE_DOCUMENT: true,
        RETURN_DOM_FRAGMENT: false,
      });
    }

    // Create file
    const file = await prisma.file.create({
      data: {
        name,
        path,
        type,
        extension,
        mimeType: getMimeType(extension),
        content: type === 'FILE' ? sanitizedContent : null,
        size: type === 'FILE' ? Buffer.byteLength(sanitizedContent, 'utf8') : 0,
        parentId,
        projectId,
      },
      select: {
        id: true,
        name: true,
        path: true,
        type: true,
        extension: true,
        size: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    console.error('Create file error:', error);
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    );
  }
}

/**
 * Get MIME type from extension
 */
function getMimeType(extension: string | null): string {
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.jsx': 'application/javascript',
    '.ts': 'application/typescript',
    '.tsx': 'application/typescript',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.py': 'text/x-python',
  };

  return mimeTypes[extension || ''] || 'text/plain';
}
