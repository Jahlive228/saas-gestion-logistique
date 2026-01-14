import { AppLayout } from '@/components/layout/app-layout';

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
