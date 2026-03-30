import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Spentum — Personal Finance Tracker',
  description: 'Track income and expenses, forecast your balance across 7 years, and take control of your personal finances with Spentum.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('budgetapp_theme');if(t!=='light')document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased bg-brand-bg dark:bg-[#0C1F1E] text-brand-text dark:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
