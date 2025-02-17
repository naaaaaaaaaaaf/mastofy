export type ColumnType = 'home' | 'local' | 'notifications' | 'public' | 'hashtag';

export interface Column {
  id: string;
  type: ColumnType;
  title: string;
  options?: {
    hashtag?: string;
  };
}

export interface ColumnSettings {
  columns: Column[];
}