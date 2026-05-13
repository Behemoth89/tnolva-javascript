import Dexie, { type Table } from 'dexie'
import type { ActiveTeamRecord } from '@/types/team'

export class NutikasAuth extends Dexie {
  auth!: Table<{ key: string; value: string }>
  activeTeam!: Table<ActiveTeamRecord>

  constructor() {
    super('NutikasAuth')
    this.version(1).stores({
      auth: 'key' // primary key is 'jwt' or 'refreshToken'
    })
    this.version(2).stores({
      activeTeam: 'id' // primary key is 'current' (constant)
    })
  }
}

export const db = new NutikasAuth()

// Dexie StorageLike adapter for potential future Pinia plugin use
// NOTE: StorageLike requires synchronous getItem/setItem, but Dexie is async.
// For token persistence, we use Dexie directly in store actions (see auth.ts).
// This adapter is provided for non-token state only if needed.
export const dexieStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const record = await db.auth.get(key)
    return record?.value ?? null
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await db.auth.put({ key, value })
  },
  removeItem: async (key: string): Promise<void> => {
    await db.auth.delete(key)
  }
}