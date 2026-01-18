import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, isAuthenticated } from '@/lib/auth/middleware';
import { processAIRequest, isAIConfigured, AIAction } from '@/lib/ai/provider';
import prisma from '@/lib/db/prisma';

/**
 * POST /api/ai
 * Process AI code assistant requests
 */

const aiRequestSchema = z.object({
  action: z.enum(['explain', 'fix', 'generate', 'refactor']),
  code: z.string().max(10000).optional(),
  context: z.string().max(5000).optional(),
  prompt: z.string().max(1000).optional(),
  language: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!isAuthenticated(auth)) return auth;

  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        { error: 'AI assistant is not configured' },
        { status: 501 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const result = aiRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { action, code, context, prompt, language } = result.data;

    // Validate that required fields are present
    if ((action === 'explain' || action === 'fix' || action === 'refactor') && !code) {
      return NextResponse.json(
        { error: 'Code is required for this action' },
        { status: 400 }
      );
    }

    if (action === 'generate' && !prompt) {
      return NextResponse.json(
        { error: 'Prompt is required for code generation' },
        { status: 400 }
      );
    }

    // Process AI request
    const startTime = Date.now();
    
    const aiResponse = await processAIRequest({
      action: action as AIAction,
      code: code || '',
      context,
      prompt,
      language,
    });

    const latencyMs = Date.now() - startTime;

    // Log AI usage
    await prisma.aIUsageLog.create({
      data: {
        userId: auth.user.userId,
        action,
        inputTokens: aiResponse.tokensUsed.input,
        outputTokens: aiResponse.tokensUsed.output,
        model: process.env.OPENAI_MODEL || process.env.GROQ_MODEL || 'unknown',
        latencyMs,
      },
    });

    return NextResponse.json({
      result: aiResponse.result,
      action,
      tokensUsed: aiResponse.tokensUsed.input + aiResponse.tokensUsed.output,
      latencyMs,
    });
  } catch (error) {
    console.error('AI request error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
