export interface Status {
  id: string;
  content: string;
  createdAt: string;
  account: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  mediaAttachments: {
    id: string;
    type: string;
    url: string;
    previewUrl: string;
  }[];
  reblog: Status | null;
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