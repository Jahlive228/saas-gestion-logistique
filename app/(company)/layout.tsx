import { Layout } from '@/components/layout/layout';

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
