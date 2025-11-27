import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface QueuedAction {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
  teamId: string;
}

interface ConflictData {
  id: string;
  actionId: string;
  localData: any;
  serverData: any;
  table: string;
  type: 'update' | 'delete';
  timestamp: number;
}

interface OfflineQueueDB extends DBSchema {
  actions: {
    key: string;
    value: QueuedAction;
    indexes: { 'by-timestamp': number; 'by-team': string };
  };
  conflicts: {
    key: string;
    value: ConflictData;
    indexes: { 'by-timestamp': number };
  };
}

class OfflineQueueManager {
  private db: IDBPDatabase<OfflineQueueDB> | null = null;
  private readonly DB_NAME = 'soccerSquadOfflineQueue';
  private readonly DB_VERSION = 1;

  async initialize() {
    if (this.db) return;

    try {
      this.db = await openDB<OfflineQueueDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('actions')) {
            const store = db.createObjectStore('actions', { keyPath: 'id' });
            store.createIndex('by-timestamp', 'timestamp');
            store.createIndex('by-team', 'teamId');
          }
          
          if (!db.objectStoreNames.contains('conflicts')) {
            const conflictStore = db.createObjectStore('conflicts', { keyPath: 'id' });
            conflictStore.createIndex('by-timestamp', 'timestamp');
          }
        },
      });
      console.log('[OfflineQueue] Database initialized');
    } catch (error) {
      console.error('[OfflineQueue] Failed to initialize database:', error);
    }
  }

  async enqueue(
    type: QueuedAction['type'],
    table: string,
    data: any,
    teamId: string
  ): Promise<string> {
    if (!this.db) await this.initialize();

    const action: QueuedAction = {
      id: crypto.randomUUID(),
      type,
      table,
      data,
      timestamp: Date.now(),
      retries: 0,
      teamId,
    };

    await this.db!.put('actions', action);
    console.log('[OfflineQueue] Action enqueued:', action);
    return action.id;
  }

  async getAll(): Promise<QueuedAction[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAll('actions');
  }

  async getAllByTeam(teamId: string): Promise<QueuedAction[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAllFromIndex('actions', 'by-team', teamId);
  }

  async remove(id: string): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.delete('actions', id);
    console.log('[OfflineQueue] Action removed:', id);
  }

  async updateRetries(id: string, retries: number): Promise<void> {
    if (!this.db) await this.initialize();
    const action = await this.db!.get('actions', id);
    if (action) {
      action.retries = retries;
      await this.db!.put('actions', action);
    }
  }

  async clear(): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.clear('actions');
    console.log('[OfflineQueue] Queue cleared');
  }

  async getCount(): Promise<number> {
    if (!this.db) await this.initialize();
    return this.db!.count('actions');
  }

  // Conflict management
  async addConflict(
    actionId: string,
    localData: any,
    serverData: any,
    table: string,
    type: 'update' | 'delete'
  ): Promise<string> {
    if (!this.db) await this.initialize();

    const conflict: ConflictData = {
      id: crypto.randomUUID(),
      actionId,
      localData,
      serverData,
      table,
      type,
      timestamp: Date.now(),
    };

    await this.db!.put('conflicts', conflict);
    console.log('[OfflineQueue] Conflict added:', conflict);
    return conflict.id;
  }

  async getAllConflicts(): Promise<ConflictData[]> {
    if (!this.db) await this.initialize();
    return this.db!.getAll('conflicts');
  }

  async removeConflict(id: string): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.delete('conflicts', id);
    console.log('[OfflineQueue] Conflict resolved:', id);
  }

  async getConflictCount(): Promise<number> {
    if (!this.db) await this.initialize();
    return this.db!.count('conflicts');
  }
}

export const offlineQueue = new OfflineQueueManager();
export type { QueuedAction, ConflictData };
