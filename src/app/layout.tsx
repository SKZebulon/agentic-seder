import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#06040a',
};

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Crimson+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;1,300;1,400&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: 'var(--seder-bg-deep)', fontFamily: "var(--font-body)" }}>
        {children}
      </body>
    </html>
  );
}
