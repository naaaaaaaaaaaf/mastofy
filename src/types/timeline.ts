export interface Status {
  id: string;
  content: string;
  createdAt: string;
  account: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    acct: string;  // 完全なアカウント名 (ドメインを含む)
  };
  mediaAttachments: {
    id: string;
    type: string;
    url: string;
    previewUrl: string;
  }[];
  reblog: Status | null;
  // リアクション関連のフィールド
  favorited: boolean;
  reblogged: boolean;
  favouritesCount: number;
  reblogsCount: number;
  // CW関連のフィールドを追加
  spoilerText: string;
  sensitive: boolean;
}

export interface Notification {
  id: string;
  type: 'follow' | 'favourite' | 'reblog' | 'mention';
  createdAt: string;
  account: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  status?: Status;
}