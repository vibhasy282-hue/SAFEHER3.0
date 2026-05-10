import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from '@/context/AuthContext';
import { EmergencyProvider } from '@/context/EmergencyContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SafeHer - AI Powered Women Safety Platform',
  description: 'AI-powered emergency safety platform designed for women safety',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <EmergencyProvider>
            {children}
          </EmergencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
