'use client';

import { NavSidebar } from './NavSidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavSidebar />
      <div className="lg:pl-[220px]">
        {children}
      </div>
    </>
  );
}
