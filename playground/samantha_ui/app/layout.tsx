import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Samantha - AI Assistant',
  description: 'Your personal AI assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-satoshi antialiased">{children}</body>
    </html>
  );
}