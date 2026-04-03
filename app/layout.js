import './globals.css';

export const metadata = {
  title: 'HN Concept Graph',
  description: 'An interactive concept map of what Hacker News is talking about right now.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
