'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardBody, CardHeader } from '@nextui-org/react';
import { EyeSlashFilledIcon, EyeFilledIcon } from '@nextui-org/shared-icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la connexion');
        setIsLoading(false);
        return;
      }

      // Rediriger selon le rôle
      const role = data.user?.role;
      if (role === 'OWNER') {
        router.push('/platform/dashboard');
      } else if (role === 'COMPANY_ADMIN') {
        router.push('/company/dashboard');
      } else if (role === 'WAREHOUSE_AGENT') {
        router.push('/warehouse/dashboard');
      } else if (role === 'DRIVER') {
        router.push('/driver/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-small text-default-500">
            Connectez-vous à votre compte
          </p>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Input
              type="email"
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isRequired
              variant="bordered"
            />

            <Input
              label="Mot de passe"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              isRequired
              variant="bordered"
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                >
                  {isVisible ? (
                    <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  ) : (
                    <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
                  )}
                </button>
              }
              type={isVisible ? 'text' : 'password'}
            />

            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-default-500">Pas encore de compte ? </span>
              <a
                href="/register"
                className="text-primary hover:underline"
              >
                S'inscrire
              </a>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
