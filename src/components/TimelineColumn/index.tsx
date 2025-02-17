import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createClient, getHomeTimeline, getLocalTimeline, getPublicTimeline, getNotifications, getHashtagTimeline } from '../../services/mastodon';
import { Column } from '../../types/column';
import { Status, Notification } from '../../types/timeline';

interface ColumnProps {
  column: Column;
}

export default function TimelineColumn({ column }: ColumnProps) {
  const [items, setItems] = useState<(Status | Notification)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { auth } = useAuth();

  useEffect(() => {
    if (!auth.accessToken || !auth.instance) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const client = createClient(auth.instance, auth.accessToken);
        let data: (Status | Notification)[] = [];

        switch (column.type) {
          case 'home':
            data = await getHomeTimeline(client);
            break;
          case 'local':
            data = await getLocalTimeline(client);
            break;
          case 'public':
            data = await getPublicTimeline(client);
            break;
          case 'notifications':
            data = await getNotifications(client);
            break;
          case 'hashtag':
            if (column.options?.hashtag) {
              data = await getHashtagTimeline(client, column.options.hashtag);
            }
            break;
        }

        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [column, auth.accessToken, auth.instance]);

  const renderItem = (item: Status | Notification) => {
    if ('type' in item && item.type) {
      // Notification
      return (
        <div key={item.id} className="notification-item">
          <img src={item.account.avatarUrl} alt={item.account.username} className="avatar" />
          <div className="notification-content">
            <strong>{item.account.displayName}</strong>
            <span className="notification-type">{item.type}</span>
            {item.status && <div className="status-content" dangerouslySetInnerHTML={{ __html: item.status.content }} />}
          </div>
        </div>
      );
    } else {
      // Status
      return (
        <div key={item.id} className="status-item">
          <img src={item.account.avatarUrl} alt={item.account.username} className="avatar" />
          <div className="status-content">
            <strong>{item.account.displayName}</strong>
            <span className="username">@{item.account.username}</span>
            <div dangerouslySetInnerHTML={{ __html: item.content }} />
            {item.mediaAttachments.length > 0 && (
              <div className="media-attachments">
                {item.mediaAttachments.map(media => (
                  <img key={media.id} src={media.previewUrl} alt="" className="media-preview" />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="timeline-column">
      <div className="column-header">
        <h2>{column.title}</h2>
      </div>
      <div className="column-content">
        {isLoading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}
        <div className="items-list">
          {items.map(renderItem)}
        </div>
      </div>
    </div>
  );
}