import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';

import Navigation from '@/components/Navigation';

import './globals.css';
import '../styles/components.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wedding Photo Stash',
  description: 'Secure wedding photo storage and sharing platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.variable} ${playfairDisplay.variable} antialiased`}>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
