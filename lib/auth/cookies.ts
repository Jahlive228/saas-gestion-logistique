import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 jours
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 7, // 7 jours
};

/**
 * Définit les cookies d'authentification
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  // Cookie pour le token d'accès (15 min)
  response.cookies.set('token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 15, // 15 minutes
  });

  // Cookie pour le token de rafraîchissement (7 jours)
  response.cookies.set('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  // Cookie pour la session (pour vérification rapide côté client)
  response.cookies.set('session', 'active', {
    ...COOKIE_OPTIONS,
    httpOnly: false, // Accessible côté client pour vérification
    maxAge: 60 * 15, // 15 minutes
  });

  return response;
}

/**
 * Supprime les cookies d'authentification
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete('token');
  response.cookies.delete('refreshToken');
  response.cookies.delete('session');

  return response;
}

/**
 * Récupère le token d'accès depuis les cookies
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('token')?.value || null;
}

/**
 * Récupère le token de rafraîchissement depuis les cookies
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('refreshToken')?.value || null;
}

/**
 * Vérifie si une session est active
 */
export async function hasActiveSession(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}
