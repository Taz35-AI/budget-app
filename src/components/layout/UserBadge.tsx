'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function UserBadge() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  if (!user) return null;

  const fullName: string = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
  const email = user.email ?? '';
  const avatarUrl: string | undefined = user.user_metadata?.avatar_url;

  const displayName = fullName || email.split('@')[0];
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.06] hover:bg-white/[0.1] transition-all duration-200 active:scale-[0.97]">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-teal-500/30 to-teal-400/20 flex items-center justify-center">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName} width={28} height={28} className="w-full h-full object-cover" unoptimized />
        ) : (
          <span className="text-[10px] font-bold text-teal-300 font-display">{initials}</span>
        )}
      </div>

      {/* Name + email */}
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-teal-100 truncate leading-tight font-display">{displayName}</span>
        {fullName && (
          <span className="text-[10px] text-teal-400/40 truncate leading-tight">{email}</span>
        )}
      </div>
    </Link>
  );
}
