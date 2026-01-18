import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { requireAuth, isAuthenticated } from '@/lib/auth/middleware';

/**
 * GET /api/projects
 * List all projects for the authenticated user
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const projects = await prisma.project.findMany({
      where: { userId: auth.user.userId },
      orderBy: { lastOpenedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        language: true,
        framework: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        lastOpenedAt: true,
        _count: {
          select: { files: true },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('List projects error:', error);
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  language: z.string().default('javascript'),
  framework: z.string().optional(),
  isPublic: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    const body = await request.json();
    const result = createProjectSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, language, framework, isPublic } = result.data;

    // Check project limit
    const projectCount = await prisma.project.count({
      where: { userId: auth.user.userId },
    });

    const maxProjects = parseInt(process.env.MAX_PROJECTS_PER_USER || '20');
    if (projectCount >= maxProjects) {
      return NextResponse.json(
        { error: `Maximum ${maxProjects} projects allowed` },
        { status: 403 }
      );
    }

    // Generate unique slug
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists
    const existingSlug = await prisma.project.findFirst({
      where: {
        userId: auth.user.userId,
        slug,
      },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        slug,
        description,
        language,
        framework,
        isPublic,
        userId: auth.user.userId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        language: true,
        framework: true,
        isPublic: true,
        createdAt: true,
      },
    });

    // Create default files based on language
    await createDefaultFiles(project.id, language);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

/**
 * Create default files for a new project
 */
async function createDefaultFiles(projectId: string, language: string) {
  const defaultFiles: { name: string; path: string; content: string; extension: string; mimeType: string }[] = [];

  if (language === 'javascript' || language === 'html') {
    defaultFiles.push(
      {
        name: 'index.html',
        path: '/index.html',
        extension: '.html',
        mimeType: 'text/html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Hello, World!</h1>
  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        name: 'styles.css',
        path: '/styles.css',
        extension: '.css',
        mimeType: 'text/css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  padding: 2rem;
}

h1 {
  color: #333;
}`,
      },
      {
        name: 'script.js',
        path: '/script.js',
        extension: '.js',
        mimeType: 'application/javascript',
        content: `// Your JavaScript code here
console.log('Hello, World!');`,
      }
    );
  } else if (language === 'typescript') {
    defaultFiles.push({
      name: 'index.ts',
      path: '/index.ts',
      extension: '.ts',
      mimeType: 'application/typescript',
      content: `// TypeScript entry point
const greeting: string = 'Hello, TypeScript!';
console.log(greeting);`,
    });
  } else if (language === 'python') {
    defaultFiles.push({
      name: 'main.py',
      path: '/main.py',
      extension: '.py',
      mimeType: 'text/x-python',
      content: `# Python entry point
def main():
    print("Hello, Python!")

if __name__ == "__main__":
    main()`,
    });
  }

  // Create files in database
  for (const file of defaultFiles) {
    await prisma.file.create({
      data: {
        ...file,
        type: 'FILE',
        size: Buffer.byteLength(file.content, 'utf8'),
        projectId,
      },
    });
  }
}
