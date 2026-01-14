// Types de rôles
type Role = 'OWNER' | 'COMPANY_ADMIN' | 'WAREHOUSE_AGENT' | 'DRIVER';

export interface MenuItem {
  title: string;
  href: string;
  icon: string; // Nom de l'icône SVG ou emoji
  badge?: string | number;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const getSidebarMenus = (role: Role): MenuSection[] => {
  switch (role) {
    case 'OWNER':
      return [
        {
          title: 'Principal',
          items: [
            {
              title: 'Dashboard',
              href: '/platform/dashboard',
              icon: 'home',
            },
            {
              title: 'Entreprises',
              href: '/platform/companies',
              icon: 'building',
            },
            {
              title: 'Utilisateurs',
              href: '/platform/users',
              icon: 'users',
            },
            {
              title: 'Statistiques',
              href: '/platform/statistics',
              icon: 'chart',
            },
          ],
        },
        {
          title: 'Administration',
          items: [
            {
              title: 'Paramètres',
              href: '/platform/settings',
              icon: 'settings',
            },
          ],
        },
      ];

    case 'COMPANY_ADMIN':
      return [
        {
          title: 'Principal',
          items: [
            {
              title: 'Dashboard',
              href: '/company/dashboard',
              icon: 'home',
            },
            {
              title: 'Livraisons',
              href: '/company/deliveries',
              icon: 'truck',
            },
            {
              title: 'Livreurs',
              href: '/company/drivers',
              icon: 'users',
            },
            {
              title: 'Entrepôts',
              href: '/company/warehouses',
              icon: 'warehouse',
            },
            {
              title: 'Produits',
              href: '/company/products',
              icon: 'package',
            },
          ],
        },
        {
          title: 'Rapports',
          items: [
            {
              title: 'Statistiques',
              href: '/company/statistics',
              icon: 'chart',
            },
            {
              title: 'Historique',
              href: '/company/history',
              icon: 'history',
            },
          ],
        },
        {
          title: 'Paramètres',
          items: [
            {
              title: 'Configuration',
              href: '/company/settings',
              icon: 'settings',
            },
          ],
        },
      ];

    case 'WAREHOUSE_AGENT':
      return [
        {
          title: 'Principal',
          items: [
            {
              title: 'Dashboard',
              href: '/warehouse/dashboard',
              icon: 'home',
            },
            {
              title: 'Livraisons',
              href: '/warehouse/deliveries',
              icon: 'truck',
            },
            {
              title: 'Stock',
              href: '/warehouse/stock',
              icon: 'package',
            },
            {
              title: 'Préparations',
              href: '/warehouse/preparations',
              icon: 'clipboard',
            },
          ],
        },
        {
          title: 'Paramètres',
          items: [
            {
              title: 'Configuration',
              href: '/warehouse/settings',
              icon: 'settings',
            },
          ],
        },
      ];

    case 'DRIVER':
      return [
        {
          title: 'Principal',
          items: [
            {
              title: 'Dashboard',
              href: '/driver/dashboard',
              icon: 'home',
            },
            {
              title: 'Mes Livraisons',
              href: '/driver/deliveries',
              icon: 'truck',
            },
            {
              title: 'Historique',
              href: '/driver/history',
              icon: 'history',
            },
          ],
        },
        {
          title: 'Profil',
          items: [
            {
              title: 'Mon Profil',
              href: '/driver/profile',
              icon: 'user',
            },
          ],
        },
      ];

    default:
      return [];
  }
};
