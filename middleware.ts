import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, decodeToken } from '@/lib/auth/jwt';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { refreshSession } from '@/lib/auth/session';

// Routes publiques (pas besoin d'authentification)
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

// Routes qui nécessitent un rôle spécifique
const roleRoutes: Record<string, string[]> = {
  '/platform': ['OWNER'],
  '/company': ['OWNER', 'COMPANY_ADMIN'],
  '/warehouse': ['OWNER', 'COMPANY_ADMIN', 'WAREHOUSE_AGENT'],
  '/driver': ['DRIVER'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Autoriser les routes publiques
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Autoriser les assets statiques
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Récupérer le token depuis les cookies
  const token = request.cookies.get('token')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // Si pas de token, rediriger vers login
  if (!token && !refreshToken) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  let payload;
  let response = NextResponse.next();

  try {
    // Essayer de vérifier le token d'accès
    if (token) {
      payload = verifyAccessToken(token);
    } else if (refreshToken) {
      // Essayer de rafraîchir la session
      const refreshed = await refreshSession(refreshToken);
      if (refreshed) {
        // Définir les nouveaux cookies
        response = setAuthCookies(response, refreshed.accessToken, refreshed.newRefreshToken);
        // Décode le nouveau token pour obtenir le payload
        payload = decodeToken(refreshed.accessToken);
      } else {
        // Refresh token invalide, déconnecter
        response = clearAuthCookies(response);
        if (pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    if (!payload) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Vérifier les permissions selon la route
    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(payload.role)) {
          if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        break;
      }
    }

    // Ajouter les informations utilisateur dans les headers pour les API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-email', payload.email);
    if (payload.companyId) {
      requestHeaders.set('x-company-id', payload.companyId);
    }

    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-role', payload.role);
    response.headers.set('x-user-email', payload.email);
    if (payload.companyId) {
      response.headers.set('x-company-id', payload.companyId);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Token invalide ou expiré
    if (refreshToken) {
      // Essayer de rafraîchir
      const refreshed = await refreshSession(refreshToken);
      if (refreshed) {
        response = setAuthCookies(response, refreshed.accessToken, refreshed.newRefreshToken);
        return response;
      }
    }

    // Déconnecter l'utilisateur
    response = clearAuthCookies(response);
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Import de setAuthCookies pour le middleware
async function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): Promise<NextResponse> {
  response.cookies.set('token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  });

  response.cookies.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });

  response.cookies.set('session', 'active', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
