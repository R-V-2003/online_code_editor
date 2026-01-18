import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken, TokenPayload } from './jwt';
import prisma from '@/lib/db/prisma';

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

export interface AuthenticatedRequest extends NextRequest {
  user: {
    userId: string;
    email: string;
  };
}

/**
 * Middleware to require authentication
 * Returns null if authenticated, or NextResponse if not
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: TokenPayload } | NextResponse> {
  // Get access token from header or cookie
  const authHeader = request.headers.get('authorization');
  let accessToken: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    accessToken = authHeader.substring(7);
  } else {
    accessToken = request.cookies.get('access_token')?.value;
  }

  if (!accessToken) {
    // Try to refresh using refresh token
    const refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (refreshToken) {
      const refreshPayload = await verifyRefreshToken(refreshToken);
      
      if (refreshPayload) {
        const user = await prisma.user.findUnique({
          where: { id: refreshPayload.userId },
          select: { id: true, email: true, isActive: true },
        });
        
        if (user && user.isActive) {
          // Generate new access token
          const newAccessToken = await generateAccessToken(user.id, user.email);
          
          // Return success with new token in header
          const response = NextResponse.json(
            { error: 'Token refreshed', newToken: true },
            { status: 200 }
          );
          
          response.cookies.set('access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 minutes
            path: '/',
          });
          
          return {
            user: {
              userId: user.id,
              email: user.email,
              type: 'access',
            },
          };
        }
      }
    }
    
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Verify access token
  const payload = await verifyAccessToken(accessToken);

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { isActive: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: 'User not found or inactive' },
      { status: 401 }
    );
  }

  return { user: payload };
}

/**
 * Optional auth - returns user if authenticated, null otherwise
 */
export async function optionalAuth(
  request: NextRequest
): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('authorization');
  let accessToken: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    accessToken = authHeader.substring(7);
  } else {
    accessToken = request.cookies.get('access_token')?.value;
  }

  if (!accessToken) {
    return null;
  }

  return verifyAccessToken(accessToken);
}

/**
 * Helper to extract user from requireAuth result
 */
export function isAuthenticated(
  result: { user: TokenPayload } | NextResponse
): result is { user: TokenPayload } {
  return 'user' in result;
}
