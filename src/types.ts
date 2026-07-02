export interface Note {
  id: string;
  title: string;
  date: string;
  time: string;
  content: string;
  updated_at: string;
}

export type StorageMode = 'db' | 'file';
