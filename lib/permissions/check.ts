import { Role } from '@prisma/client';

/**
 * Vérifie si un rôle peut accéder à une entreprise
 */
export function canAccessCompany(role: Role, companyId: string | null | undefined): boolean {
  if (role === 'OWNER') {
    return true; // Owner peut accéder à toutes les entreprises
  }
  return !!companyId; // Autres rôles doivent avoir un companyId
}

/**
 * Vérifie si un rôle peut créer une livraison
 */
export function canCreateDelivery(role: Role): boolean {
  return ['OWNER', 'COMPANY_ADMIN'].includes(role);
}

/**
 * Vérifie si un rôle peut préparer une livraison
 */
export function canPrepareDelivery(role: Role): boolean {
  return ['OWNER', 'COMPANY_ADMIN', 'WAREHOUSE_AGENT'].includes(role);
}

/**
 * Vérifie si un rôle peut mettre à jour le statut d'une livraison
 */
export function canUpdateDeliveryStatus(
  role: Role,
  deliveryDriverId: string | null,
  userDriverId: string | null
): boolean {
  if (role === 'OWNER' || role === 'COMPANY_ADMIN') {
    return true;
  }
  if (role === 'DRIVER') {
    // Un livreur ne peut mettre à jour que ses propres livraisons
    return deliveryDriverId === userDriverId;
  }
  return false;
}

/**
 * Vérifie si un rôle peut voir les statistiques
 */
export function canViewStats(role: Role): boolean {
  return ['OWNER', 'COMPANY_ADMIN'].includes(role);
}

/**
 * Vérifie si un rôle peut gérer les utilisateurs
 */
export function canManageUsers(role: Role): boolean {
  return ['OWNER', 'COMPANY_ADMIN'].includes(role);
}

/**
 * Vérifie si un rôle peut gérer les entrepôts
 */
export function canManageWarehouses(role: Role): boolean {
  return ['OWNER', 'COMPANY_ADMIN'].includes(role);
}

/**
 * Vérifie si un rôle peut gérer les livreurs
 */
export function canManageDrivers(role: Role): boolean {
  return ['OWNER', 'COMPANY_ADMIN'].includes(role);
}
