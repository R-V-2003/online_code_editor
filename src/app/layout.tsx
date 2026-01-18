import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Cloud Code Editor',
  description: 'A cloud-based code editor with AI assistance',
  keywords: ['code editor', 'IDE', 'cloud', 'AI', 'programming'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${firaCode.variable} font-sans bg-gray-900 text-gray-100`}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#1f2937',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#1f2937',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
