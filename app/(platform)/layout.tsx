import { AppLayout } from '@/components/layout/app-layout';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
