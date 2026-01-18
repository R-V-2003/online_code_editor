import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
} from '@/lib/auth/jwt';

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        passwordHash,
        emailVerified: false, // In production, send verification email
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Generate tokens
    const accessToken = await generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(
      user.id,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || undefined
    );

    // Set cookies
    await setAuthCookies(accessToken, refreshToken);

    // Create default project for new user
    await prisma.project.create({
      data: {
        name: 'My First Project',
        slug: 'my-first-project',
        description: 'Welcome to Cloud Code Editor!',
        userId: user.id,
        language: 'javascript',
      },
    });

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
