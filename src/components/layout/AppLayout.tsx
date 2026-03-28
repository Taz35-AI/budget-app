'use client';

import { NavSidebar } from './NavSidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavSidebar />
      {/* lg:pl-[230px] = sidebar width; pb-16 = mobile bottom nav height */}
      <div className="lg:pl-[230px] pb-16 lg:pb-0">
        {children}
      </div>
    </>
  );
}
