import type { Metadata } from 'next';

import TopNavbar from '@/app/components/TopNavbar';

import { playfairDisplay, wonderUnitSans, thicccboi, garet, sonoMono } from '@/styles/fonts';

import './globals.css';

export const metadata: Metadata = {
  title: 'Wedding Memories',
  description: 'Wedding photo and video storage and sharing platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${playfairDisplay.variable} ${wonderUnitSans.variable} ${thicccboi.variable} ${garet.variable} ${sonoMono.variable} antialiased`}
        // className={`${inter.variable} ${playfairDisplay.variable} ${wonderUnitSans.variable} ${thicccboi.variable} antialiased`}
      >
        <TopNavbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
