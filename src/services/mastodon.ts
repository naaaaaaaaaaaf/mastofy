import generator from 'megalodon';

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