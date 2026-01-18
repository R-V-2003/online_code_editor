import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getGoogleTokens, getGoogleUserInfo } from '@/lib/auth/google';
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '@/lib/auth/jwt';

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        new URL('/login?error=google_auth_failed', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=no_code', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getGoogleTokens(code);

    // Get user info
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.id },
          { email: googleUser.email.toLowerCase() },
        ],
      },
    });

    if (user) {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.id,
            avatarUrl: user.avatarUrl || googleUser.picture,
            emailVerified: true,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Just update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email.toLowerCase(),
          name: googleUser.name,
          googleId: googleUser.id,
          avatarUrl: googleUser.picture,
          emailVerified: true,
        },
      });

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
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.redirect(
        new URL('/login?error=account_deactivated', request.url)
      );
    }

    // Generate tokens
    const accessToken = await generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(
      user.id,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || undefined
    );

    // Set cookies
    await setAuthCookies(accessToken, refreshToken);

    // Redirect to editor
    return NextResponse.redirect(new URL('/editor', request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', request.url)
    );
  }
}
