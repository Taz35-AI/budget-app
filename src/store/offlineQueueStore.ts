import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TransactionFormValues } from '@/types';

export interface QueuedTransaction {
  queueId: string;
  values: TransactionFormValues;
  accountId?: string | null;
  optimisticId: string;
  queuedAt: string;
}

interface OfflineQueueState {
  pending: QueuedTransaction[];
  enqueue: (item: QueuedTransaction) => void;
  dequeue: (queueId: string) => void;
  clearAll: () => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set) => ({
      pending: [],
      enqueue: (item) => set((s) => ({ pending: [...s.pending, item] })),
      dequeue: (queueId) => set((s) => ({ pending: s.pending.filter((i) => i.queueId !== queueId) })),
      clearAll: () => set({ pending: [] }),
    }),
    { name: 'bt_offline_queue' },
  ),
);
