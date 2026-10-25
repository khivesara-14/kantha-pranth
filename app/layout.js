import './globals.css';
import AuthGate from '../components/AuthGate';

const siteUrl = 'https://kantha-pranth.vercel.app';
const description = 'Connect, discover, help and support the Jain community in Bengaluru.';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#781e29',
};

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Kantha Pranth — Bengaluru Jain Community',
  description,
  applicationName: 'Kantha Pranth',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'Kantha Pranth — Bengaluru Jain Community',
    description,
    siteName: 'Kantha Pranth',
    locale: 'en_IN',
    type: 'website',
    url: siteUrl,
  },
  twitter: { card: 'summary', title: 'Kantha Pranth — Bengaluru Jain Community', description },
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><AuthGate>{children}</AuthGate></body></html>;
}
