import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { MoodProvider } from './contexts/MoodContext';
import Header from './components/Header';
import { inter } from './lib/fonts';

export const metadata: Metadata = {
  title: 'Mindsetr: Mood Tracker',
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
        <Header />
        <main className="pt-6">
          <MoodProvider>
            {children}
            <Toaster />
          </MoodProvider>
        </main>
      </body>
    </html>
  );
}