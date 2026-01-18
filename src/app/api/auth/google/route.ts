import { NextResponse } from 'next/server';
import { getGoogleAuthUrl, isGoogleOAuthConfigured } from '@/lib/auth/google';

/**
 * GET /api/auth/google
 * Redirect to Google OAuth consent screen
 */
export async function GET() {
  try {
    if (!isGoogleOAuthConfigured()) {
      return NextResponse.json(
        { error: 'Google OAuth is not configured' },
        { status: 501 }
      );
    }

    const authUrl = getGoogleAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}
