import type { Metadata } from 'next';
import { Crimson_Pro } from 'next/font/google';
import './globals.css';

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-crimson',
});

export const metadata: Metadata = {
  title: 'The Agentic Seder — AI-Powered Passover Experience',
  description: 'A fully autonomous 3D Passover Seder with AI-generated character dialogue, spoken audio, and the complete Haggadah in Hebrew and English.',
  openGraph: {
    title: 'The Agentic Seder',
    description: '12 characters. Full Haggadah. AI-generated dialogue. Watch a complete Passover Seder unfold in 3D.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={crimsonPro.variable}>
      <body className={crimsonPro.className} style={{ margin: 0, padding: 0, background: '#0C0906' }}>
        {children}
      </body>
    </html>
  );
}
