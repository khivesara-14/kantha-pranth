import './globals.css';
import AuthGate from '../components/AuthGate';

export const metadata = {
  title: 'Kantha Pranth — Bengaluru Jain Community',
  description: 'Connect, discover, help and support the Jain community in Bengaluru.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><AuthGate>{children}</AuthGate></body></html>;
}
