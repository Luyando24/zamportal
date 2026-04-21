import Dexie, { Table } from "dexie";
import type {
  User,
} from "@shared/api";

export interface SyncQueueItem {
  id: string;
  action: string;
  payload: any;
  op?: any; // Legacy support for sync.ts
  retryCount: number;
  lastError?: string;
  createdAt: string;
}

export class PortalDb extends Dexie {
  users!: Table<User, string>;
  syncQueue!: Table<SyncQueueItem, string>;

  constructor() {
    super("portal_db_v2"); // Bump version
    this.version(1).stores({
      users: "id,email,nrc,role,isActive",
      syncQueue: "id,createdAt",
    });
  }
}

export const db = new PortalDb();
