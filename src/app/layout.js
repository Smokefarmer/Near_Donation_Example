'use client';
import './globals.css';

import { Navigation } from '@/components/navigation';
import { AuthProvider } from '../wallets/authContext';

export default function RootLayout({ children }) {


  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
