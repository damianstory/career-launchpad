import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Career LaunchPAD',
  description: 'Student-first career discovery for the myBlueprint moments where future decisions already start.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
