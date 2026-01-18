import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * JWT Authentication Utilities
 * Handles token creation, verification, and session management
 */

// Environment configuration
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production');
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Token payload interface
export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

// User session interface
export interface UserSession {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

/**
 * Parse duration string to milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // Default 15 minutes
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
  };
  
  return value * (multipliers[unit] || 60 * 1000);
}

/**
 * Generate access token
 */
export async function generateAccessToken(userId: string, email: string): Promise<string> {
  const expiresIn = parseDuration(JWT_EXPIRES_IN);
  
  return new SignJWT({ userId, email, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + expiresIn) / 1000))
    .sign(JWT_SECRET);
}

/**
 * Generate refresh token and store in database
 */
export async function generateRefreshToken(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const expiresIn = parseDuration(JWT_REFRESH_EXPIRES_IN);
  const tokenId = uuidv4();
  
  const token = await new SignJWT({ userId, tokenId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + expiresIn) / 1000))
    .sign(JWT_REFRESH_SECRET);
  
  // Store refresh token in database
  await prisma.session.create({
    data: {
      userId,
      refreshToken: token,
      userAgent,
      ipAddress,
      expiresAt: new Date(Date.now() + expiresIn),
    },
  });
  
  return token;
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.type !== 'access') {
      return null;
    }
    
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
    
    if (payload.type !== 'refresh') {
      return null;
    }
    
    // Check if token exists in database (not revoked)
    const session = await prisma.session.findUnique({
      where: { refreshToken: token },
    });
    
    if (!session || session.expiresAt < new Date()) {
      return null;
    }
    
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const payload = await verifyRefreshToken(refreshToken);
  
  if (!payload) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, isActive: true },
  });
  
  if (!user || !user.isActive) {
    return null;
  }
  
  // Revoke old refresh token
  await prisma.session.delete({
    where: { refreshToken },
  });
  
  // Generate new tokens
  const newAccessToken = await generateAccessToken(user.id, user.email);
  const newRefreshToken = await generateRefreshToken(user.id);
  
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Revoke refresh token (logout)
 */
export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { refreshToken },
  });
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get current user session from cookies
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  
  if (!accessToken) {
    return null;
  }
  
  const payload = await verifyAccessToken(accessToken);
  
  if (!payload) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      isActive: true,
    },
  });
  
  if (!user || !user.isActive) {
    return null;
  }
  
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Set auth cookies
 */
export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseDuration(JWT_EXPIRES_IN) / 1000,
    path: '/',
  });
  
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: parseDuration(JWT_REFRESH_EXPIRES_IN) / 1000,
    path: '/',
  });
}

/**
 * Clear auth cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}
