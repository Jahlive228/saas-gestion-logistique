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

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
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
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      // Supprimer le token expiré
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
      return null;
    }

    // Récupérer les informations utilisateur
    const user = tokenRecord.user;

    // Générer de nouveaux tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    // Mettre à jour le refresh token en base
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: refreshToken } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
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
