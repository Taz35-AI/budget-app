import { Suspense } from 'react';
import LoginClient from './Client';

// `useSearchParams()` opts the client component out of prerendering unless it
// sits under a Suspense boundary, so the shell can render statically while the
// param-dependent part streams in.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#042F2E] via-[#0A1F1E] to-[#0F3332]" />}>
      <LoginClient />
    </Suspense>
  );
}
