import { prisma } from '@/lib/db/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, JWTPayload } from './jwt';
import { setAuthCookies, clearAuthCookies, getRefreshToken } from './cookies';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';

/**
 * Crée une session utilisateur avec tokens et cookies
 */
export async function createSession(
  userId: string,
  email: string,
  role: Role,
  companyId: string | null | undefined
): Promise<{ accessToken: string; refreshToken: string }> {
  // Générer les tokens
  const accessToken = generateAccessToken({ userId, email, role, companyId });
  const refreshToken = generateRefreshToken({ userId, email, role, companyId });

  // Stocker le refresh token en base de données
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

  // Déterminer si c'est un User ou un PlatformOwner
  const isPlatformOwner = role === 'OWNER';
  
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: isPlatformOwner ? undefined : userId,
      platformOwnerId: isPlatformOwner ? userId : undefined,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Rafraîchit une session avec un nouveau token d'accès
 */
export async function refreshSession(
  refreshToken: string
): Promise<{ accessToken: string; newRefreshToken: string } | null> {
  try {
    // Vérifier le token
    const payload = verifyRefreshToken(refreshToken);

    // Vérifier que le token existe en base et n'est pas expiré
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { 
        user: true,
        platformOwner: true,
      },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      // Supprimer le token expiré
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
      return null;
    }

    // Déterminer si c'est un User ou un PlatformOwner
    let userData: {
      id: string;
      email: string;
      role: Role;
      companyId: string | null;
    };

    if (tokenRecord.user) {
      // C'est un User
      userData = {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
        companyId: tokenRecord.user.companyId,
      };
    } else if (tokenRecord.platformOwner) {
      // C'est un PlatformOwner
      userData = {
        id: tokenRecord.platformOwner.id,
        email: tokenRecord.platformOwner.email,
        role: 'OWNER',
        companyId: null,
      };
    } else {
      return null;
    }

    // Générer de nouveaux tokens
    const accessToken = generateAccessToken({
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      companyId: userData.companyId,
    });

    const newRefreshToken = generateRefreshToken({
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      companyId: userData.companyId,
    });

    // Mettre à jour le refresh token en base
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const isPlatformOwner = userData.role === 'OWNER';

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: refreshToken } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: isPlatformOwner ? undefined : userData.id,
          platformOwnerId: isPlatformOwner ? userData.id : undefined,
          expiresAt,
        },
      }),
    ]);

    return { accessToken, newRefreshToken };
  } catch (error) {
    return null;
  }
}

/**
 * Détruit une session (logout)
 */
export async function destroySession(refreshToken: string | null): Promise<void> {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }
}

/**
 * Nettoie les tokens expirés (à appeler périodiquement)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

/**
 * Récupère les informations de session depuis les cookies
 */
export async function getSessionFromCookies(): Promise<JWTPayload | null> {
  const token = await getRefreshToken();
  if (!token) return null;

  try {
    return verifyRefreshToken(token);
  } catch {
    return null;
  }
}
