import generator, { MegalodonInterface } from 'megalodon';
import { Status, Notification } from '../types/timeline';

const CLIENT_NAME = 'Mastofy';
const SCOPES = ['read', 'write', 'follow', 'push'];

// アプリケーションのクレデンシャルを保持するためのマップ
const appCredentials = new Map<string, { clientId: string; clientSecret: string }>();

function normalizeInstanceUrl(instance: string): string {
  // Remove any protocol prefix if present
  const cleanInstance = instance.replace(/^(https?:\/\/)/, '');
  // Remove any trailing slash
  return cleanInstance.replace(/\/$/, '');
}

export async function getAuthorizationUrl(instance: string): Promise<string> {
  const normalizedInstance = normalizeInstanceUrl(instance);
  const client = generator('mastodon', `https://${normalizedInstance}`);
  
  const appData = await client.registerApp(CLIENT_NAME, {
    scopes: SCOPES,
    redirect_uris: 'urn:ietf:wg:oauth:2.0:oob'
  });

  // クレデンシャルを保存
  appCredentials.set(normalizedInstance, {
    clientId: appData.client_id,
    clientSecret: appData.client_secret,
  });

  // urlがnullの場合はエラーを投げる
  if (!appData.url) {
    throw new Error('Failed to get authorization URL');
  }

  return appData.url;
}

export async function getAccessToken(
  instance: string,
  code: string
): Promise<string> {
  const normalizedInstance = normalizeInstanceUrl(instance);
  const client = generator('mastodon', `https://${normalizedInstance}`);
  const credentials = appCredentials.get(normalizedInstance);
  
  if (!credentials) {
    throw new Error('Application credentials not found. Please try connecting to the instance again.');
  }
  
  const tokenData = await client.fetchAccessToken(
    credentials.clientId,
    credentials.clientSecret,
    code,
    'urn:ietf:wg:oauth:2.0:oob'
  );

  return tokenData.access_token;
}

export function createClient(instance: string, accessToken: string) {
  const normalizedInstance = normalizeInstanceUrl(instance);
  return generator('mastodon', `https://${normalizedInstance}`, accessToken);
}

function convertStatus(status: any): Status {
  return {
    id: status.id,
    content: status.content,
    createdAt: status.created_at,
    account: {
      id: status.account.id,
      username: status.account.username,
      displayName: status.account.display_name,
      avatarUrl: status.account.avatar,
    },
    mediaAttachments: status.media_attachments.map((media: any) => ({
      id: media.id,
      type: media.type,
      url: media.url,
      previewUrl: media.preview_url,
    })),
    reblog: status.reblog ? convertStatus(status.reblog) : null,
    // Add reaction fields
    favorited: status.favourited || false,
    reblogged: status.reblogged || false,
    favouritesCount: status.favourites_count || 0,
    reblogsCount: status.reblogs_count || 0,
  };
}

function convertNotification(notification: any): Notification {
  return {
    id: notification.id,
    type: notification.type,
    createdAt: notification.created_at,
    account: {
      id: notification.account.id,
      username: notification.account.username,
      displayName: notification.account.display_name,
      avatarUrl: notification.account.avatar,
    },
    status: notification.status ? convertStatus(notification.status) : undefined,
  };
}

export async function getHomeTimeline(client: MegalodonInterface): Promise<Status[]> {
  const response = await client.getHomeTimeline();
  return response.data.map(convertStatus);
}

export async function getLocalTimeline(client: MegalodonInterface): Promise<Status[]> {
  const response = await client.getLocalTimeline();
  return response.data.map(convertStatus);
}

export async function getPublicTimeline(client: MegalodonInterface): Promise<Status[]> {
  const response = await client.getPublicTimeline();
  return response.data.map(convertStatus);
}

export async function getNotifications(client: MegalodonInterface): Promise<Notification[]> {
  const response = await client.getNotifications();
  return response.data.map(convertNotification);
}

export async function getHashtagTimeline(client: MegalodonInterface, hashtag: string): Promise<Status[]> {
  const response = await client.getTagTimeline(hashtag);
  return response.data.map(convertStatus);
}

export async function postStatus(
  client: MegalodonInterface,
  content: string,
  mediaIds: string[] = [],
): Promise<Status> {
  const response = await client.postStatus(content, {
    visibility: 'public', // デフォルトの公開範囲を追加
    media_ids: mediaIds,
  });
  return convertStatus(response.data);
}

export async function uploadMedia(
  client: MegalodonInterface,
  file: File,
): Promise<{ id: string; url: string; preview_url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.uploadMedia(formData);
  const data = response.data;
  
  if (!data.url) {
    throw new Error('Media upload failed: No URL returned');
  }
  
  return {
    id: data.id,
    url: data.url,
    preview_url: data.preview_url ?? data.url
  };
}

export async function favoriteStatus(
  client: MegalodonInterface,
  statusId: string,
): Promise<Status> {
  const response = await client.favouriteStatus(statusId); // Using correct method name
  return convertStatus(response.data);
}

export async function unfavoriteStatus(
  client: MegalodonInterface,
  statusId: string,
): Promise<Status> {
  const response = await client.unfavouriteStatus(statusId); // Using correct method name
  return convertStatus(response.data);
}

export async function boostStatus(
  client: MegalodonInterface,
  statusId: string,
): Promise<Status> {
  const response = await client.reblogStatus(statusId); // Using correct method name
  return convertStatus(response.data);
}

export async function unboostStatus(
  client: MegalodonInterface,
  statusId: string,
): Promise<Status> {
  const response = await client.unreblogStatus(statusId); // Using correct method name
  return convertStatus(response.data);
}