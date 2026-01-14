import Link from 'next/link';
import { Button } from '@nextui-org/react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">403</h1>
        <h2 className="text-2xl font-semibold mb-4">Accès non autorisé</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <Button as={Link} href="/" color="primary" size="lg">
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}
