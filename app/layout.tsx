import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { MoodProvider } from './contexts/MoodContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mood Tracker',
  description: 'Track and analyze your daily moods',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MoodProvider>
          {children}
          <Toaster />
        </MoodProvider>
      </body>
    </html>
  );
}