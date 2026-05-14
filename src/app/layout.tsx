import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

export const metadata: Metadata = {
  title: 'Career LaunchPAD',
  description: 'Student-first career discovery for the myBlueprint moments where future decisions already start.',
  icons: {
    icon: [{ url: '/launchpad-logo.svg', type: 'image/svg+xml' }],
    shortcut: ['/launchpad-logo.svg'],
    apple: [{ url: '/launchpad-logo.svg', type: 'image/svg+xml' }],
  },
};

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
