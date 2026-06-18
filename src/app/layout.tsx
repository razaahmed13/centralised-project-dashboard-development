import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Neodym Project Dashboard',
  description: 'Centralised dashboard for Neodym project access.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
