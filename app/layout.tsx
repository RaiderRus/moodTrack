import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Playfair_Display } from 'next/font/google';
import { Toaster } from 'sonner';
import { MoodProvider } from './contexts/MoodContext';
import Header from './components/Header';

const inter = Inter({ subsets: ['latin'] });
const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair'
});

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
      <body className={`${inter.className} ${playfair.variable}`}>
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