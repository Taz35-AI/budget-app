import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BudgetTool — Personal Finance Dashboard',
  description: 'Track your income and expenses across 7 years with a beautiful calendar view.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('budgettool_theme');if(t!=='light')document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased bg-slate-50 dark:bg-[#0c0f1a] text-slate-900 dark:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
