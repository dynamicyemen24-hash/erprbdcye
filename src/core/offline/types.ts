// NEB-05: Operations OS - Offline Support Definitions
export interface OfflineQueueItem {
  id: string;
  action: string;
  payload: any;
  timestamp: string;
  synced: boolean;
  latitude?: number;
  longitude?: number;
}
