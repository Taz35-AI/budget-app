import { Suspense } from 'react';
import InviteClient from './Client';

export default function InvitePage() {
  return (
    <Suspense>
      <InviteClient />
    </Suspense>
  );
}
