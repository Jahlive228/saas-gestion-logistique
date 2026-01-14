import { redirect } from 'next/navigation';

export default function HomePage() {
  // Rediriger vers login si non authentifié (géré par middleware)
  redirect('/login');
}
