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

interface OfflineQueueDB extends DBSchema {
  actions: {
    key: string;
    value: QueuedAction;
    indexes: { 'by-timestamp': number; 'by-team': string };
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
          const store = db.createObjectStore('actions', { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
          store.createIndex('by-team', 'teamId');
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
}

export const offlineQueue = new OfflineQueueManager();
