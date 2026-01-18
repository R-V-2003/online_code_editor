import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { requireAuth, isAuthenticated } from '@/lib/auth/middleware';

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

/**
 * GET /api/projects/[projectId]
 * Get a single project with its file tree
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const { projectId } = await context.params;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.user.userId,
      },
      include: {
        files: {
          orderBy: [
            { type: 'asc' }, // Folders first
            { name: 'asc' },
          ],
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Update last opened
    await prisma.project.update({
      where: { id: projectId },
      data: { lastOpenedAt: new Date() },
    });

    // Return raw files array (FileExplorer builds tree on client)
    const filesData = project.files.map(file => ({
      id: file.id,
      name: file.name,
      path: file.path,
      type: file.type,
      extension: file.extension,
      size: file.size,
      parentId: file.parentId,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }));

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        language: project.language,
        framework: project.framework,
        isPublic: project.isPublic,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      files: filesData,
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Failed to get project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[projectId]
 * Update project details
 */
const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  language: z.string().optional(),
  framework: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const { projectId } = await context.params;
    const body = await request.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.user.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: result.data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        language: true,
        framework: true,
        isPublic: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[projectId]
 * Delete a project and all its files
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const { projectId } = await context.params;

    // Verify ownership
    const existing = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: auth.user.userId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Delete project (cascade deletes files)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

/**
 * Build hierarchical file tree from flat file list
 */
interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'FILE' | 'FOLDER';
  extension?: string | null;
  children?: FileNode[];
}

function buildFileTree(files: {
  id: string;
  name: string;
  path: string;
  type: 'FILE' | 'FOLDER';
  extension: string | null;
  parentId: string | null;
}[]): FileNode[] {
  const nodeMap = new Map<string, FileNode>();
  const rootNodes: FileNode[] = [];

  // Create nodes
  for (const file of files) {
    nodeMap.set(file.id, {
      id: file.id,
      name: file.name,
      path: file.path,
      type: file.type,
      extension: file.extension,
      children: file.type === 'FOLDER' ? [] : undefined,
    });
  }

  // Build tree
  for (const file of files) {
    const node = nodeMap.get(file.id)!;
    
    if (file.parentId && nodeMap.has(file.parentId)) {
      const parent = nodeMap.get(file.parentId)!;
      parent.children?.push(node);
    } else {
      rootNodes.push(node);
    }
  }

  return rootNodes;
}
