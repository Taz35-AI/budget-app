'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { HouseholdMember, HouseholdInvite } from '@/types';

// ─── Members ─────────────────────────────────────────────────────────────────

interface HouseholdMembersData {
  members: HouseholdMember[];
  householdId: string;
}

export function useHouseholdMembers() {
  return useQuery<HouseholdMembersData>({
    queryKey: ['household-members'],
    queryFn: async () => {
      const res = await fetch('/api/household/members');
      if (!res.ok) throw new Error('Failed to fetch household members');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch('/api/household/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to remove member');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['household-members'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// ─── Invites ─────────────────────────────────────────────────────────────────

export function useHouseholdInvites() {
  return useQuery<HouseholdInvite[]>({
    queryKey: ['household-invites'],
    queryFn: async () => {
      const res = await fetch('/api/household/invite');
      if (!res.ok) throw new Error('Failed to fetch invites');
      const data = await res.json();
      return data.invites ?? [];
    },
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; displayName?: string }) => {
      const res = await fetch('/api/household/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email, displayName: payload.displayName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create invite');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['household-invites'] });
    },
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await fetch('/api/household/invite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to revoke invite');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['household-invites'] });
    },
  });
}
