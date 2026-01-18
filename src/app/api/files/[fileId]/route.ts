import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { requireAuth, isAuthenticated } from '@/lib/auth/middleware';

interface RouteContext {
  params: Promise<{ fileId: string }>;
}

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880');

/**
 * GET /api/files/[fileId]
 * Get file content
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const { fileId } = await context.params;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (file.project.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      file: {
        id: file.id,
        name: file.name,
        path: file.path,
        type: file.type,
        extension: file.extension,
        mimeType: file.mimeType,
        content: file.content,
        size: file.size,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get file error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get file', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/files/[fileId]
 * Update file content or rename
 */
const updateFileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const { fileId } = await context.params;
    const body = await request.json();
    const result = updateFileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, content } = result.data;

    // Get existing file
    const existing = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          select: { userId: true, id: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existing.project.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: {
      name?: string;
      path?: string;
      content?: string;
      size?: number;
      extension?: string;
    } = {};

    // Handle rename
    if (name && name !== existing.name) {
      // Build new path
      const pathParts = existing.path.split('/');
      pathParts[pathParts.length - 1] = name;
      const newPath = pathParts.join('/');

      // Check if new path exists
      const pathExists = await prisma.file.findFirst({
        where: {
          projectId: existing.project.id,
          path: newPath,
          id: { not: fileId },
        },
      });

      if (pathExists) {
        return NextResponse.json(
          { error: 'A file with this name already exists' },
          { status: 409 }
        );
      }

      updateData.name = name;
      updateData.path = newPath;

      // Update extension if changed
      const dotIndex = name.lastIndexOf('.');
      if (dotIndex !== -1) {
        updateData.extension = name.substring(dotIndex).toLowerCase();
      }
    }

    // Handle content update
    if (content !== undefined) {
      // Check size limit
      const contentSize = Buffer.byteLength(content, 'utf8');
      if (contentSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
          { status: 400 }
        );
      }

      // Use content directly
      updateData.content = content;
      updateData.size = Buffer.byteLength(content, 'utf8');
    }

    // Update file
    const file = await prisma.file.update({
      where: { id: fileId },
      data: updateData,
      select: {
        id: true,
        name: true,
        path: true,
        type: true,
        extension: true,
        size: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ file });
  } catch (error) {
    console.error('Update file error:', error);
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[fileId]
 * Delete a file or folder
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const { fileId } = await context.params;

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        project: {
          select: { userId: true },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (file.project.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete file (cascade deletes children for folders)
    await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ message: 'File deleted' });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
