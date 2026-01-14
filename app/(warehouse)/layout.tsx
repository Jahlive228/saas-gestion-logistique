import { Layout } from '@/components/layout/layout';

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
