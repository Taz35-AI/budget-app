import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Spentum — Personal Finance Tracker',
  description: 'Track income and expenses, forecast your balance across 7 years, and take control of your personal finances with Spentum.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.className} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('budgetapp_theme');if(t!=='light')document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased bg-brand-bg dark:bg-[#0C0C1A] text-brand-text dark:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
