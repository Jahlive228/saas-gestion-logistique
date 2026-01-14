'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardBody, CardHeader, Select, SelectItem } from '@nextui-org/react';
import { EyeSlashFilledIcon, EyeFilledIcon } from '@nextui-org/shared-icons';

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
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className="text-2xl font-bold">Inscription</h1>
          <p className="text-small text-default-500">
            Créez votre compte
          </p>
        </CardHeader>
        <CardBody className="px-6 pb-6">
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
        </CardBody>
      </Card>
    </div>
  );
}
