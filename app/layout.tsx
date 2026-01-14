import type { Metadata } from 'next';
import { Providers } from './providers';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'SaaS Gestion Logistique',
  description: 'Plateforme SaaS de gestion logistique et livraisons multi-entreprises',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
