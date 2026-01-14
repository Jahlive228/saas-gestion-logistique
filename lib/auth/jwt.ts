import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  companyId?: string | null;
  type: 'access' | 'refresh';
}

// Durées de validité
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 jours

/**
 * Génère un token JWT d'accès
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Génère un token JWT de rafraîchissement
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Vérifie et décode un token JWT d'accès
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Vérifie et décode un token JWT de rafraîchissement
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Décode un token sans vérification (pour debug uniquement)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}
