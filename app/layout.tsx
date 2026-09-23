import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { AuthProvider } from '@/lib/authContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Command Dashboard // Unified Ops',
  description: 'Command dashboard with Zoom-inspired clean Blue, Blue-gray, and White design system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-[#F8FAFC] text-slate-800 min-h-screen antialiased selection:bg-blue-100 selection:text-blue-700 font-sans`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
