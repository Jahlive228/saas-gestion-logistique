'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, SelectItem } from '@nextui-org/react';
// Icônes SVG simples pour la visibilité du mot de passe
const EyeIcon = () => (
  <svg className="text-2xl text-default-400 pointer-events-none" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
  </svg>
);

const EyeSlashIcon = () => (
  <svg className="text-2xl text-default-400 pointer-events-none" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'COMPANY_ADMIN' as 'COMPANY_ADMIN' | 'WAREHOUSE_AGENT' | 'DRIVER',
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'inscription');
        setIsLoading(false);
        return;
      }

      // Rediriger selon le rôle
      const role = data.user?.role;
      if (role === 'COMPANY_ADMIN') {
        router.push('/company/dashboard');
      } else if (role === 'WAREHOUSE_AGENT') {
        router.push('/warehouse/dashboard');
      } else if (role === 'DRIVER') {
        router.push('/driver/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('Erreur d\'inscription. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">Inscription</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Créez votre compte
          </p>
        </div>
        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                placeholder="Jean"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                isRequired
                variant="bordered"
              />
              <Input
                label="Nom"
                placeholder="Dupont"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                isRequired
                variant="bordered"
              />
            </div>

            <Input
              type="email"
              label="Email"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              isRequired
              variant="bordered"
            />

            <Input
              label="Téléphone"
              placeholder="+33 6 12 34 56 78"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              variant="bordered"
            />

            <Select
              label="Rôle"
              placeholder="Sélectionnez votre rôle"
              selectedKeys={[formData.role]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                handleChange('role', selected);
              }}
              variant="bordered"
              isRequired
            >
              <SelectItem key="COMPANY_ADMIN" value="COMPANY_ADMIN">
                Administrateur Entreprise
              </SelectItem>
              <SelectItem key="WAREHOUSE_AGENT" value="WAREHOUSE_AGENT">
                Agent Entrepôt
              </SelectItem>
              <SelectItem key="DRIVER" value="DRIVER">
                Livreur
              </SelectItem>
            </Select>

            <Input
              label="Mot de passe"
              placeholder="Minimum 6 caractères"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              isRequired
              variant="bordered"
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={toggleVisibility}
                >
                  {isVisible ? <EyeSlashIcon /> : <EyeIcon />}
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
              {isLoading ? 'Inscription...' : 'S\'inscrire'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-default-500">Déjà un compte ? </span>
              <a
                href="/login"
                className="text-primary hover:underline"
              >
                Se connecter
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
