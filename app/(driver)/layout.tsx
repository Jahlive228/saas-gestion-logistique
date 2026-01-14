import { Layout } from '@/components/layout/layout';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
