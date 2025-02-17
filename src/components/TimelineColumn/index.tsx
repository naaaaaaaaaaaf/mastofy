import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useColumns } from '../../contexts/ColumnContext';
import { createClient, getHomeTimeline, getLocalTimeline, getPublicTimeline, getNotifications, getHashtagTimeline } from '../../services/mastodon';
import { Column } from '../../types/column';
import { Status, Notification } from '../../types/timeline';

interface ColumnProps {
  column: Column;
}

const UPDATE_INTERVAL = 30000; // 30秒ごとに更新

export default function TimelineColumn({ column }: ColumnProps) {
  const [items, setItems] = useState<(Status | Notification)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem(`column-pin-${column.id}`);
    return saved === 'true';
  });
  const { auth } = useAuth();
  const { removeColumn } = useColumns();

  const fetchData = useCallback(async () => {
    if (!auth.accessToken || !auth.instance) return;

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
      console.error('Failed to fetch timeline:', err);
    } finally {
      setIsLoading(false);
    }
  }, [column, auth.accessToken, auth.instance]);

  useEffect(() => {
    fetchData();
    
    // 定期的な更新の設定
    const intervalId = setInterval(fetchData, UPDATE_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData]);

  useEffect(() => {
    localStorage.setItem(`column-pin-${column.id}`, isPinned.toString());
  }, [isPinned, column.id]);

  const handleRemoveColumn = () => {
    if (confirm('Are you sure you want to remove this column?')) {
      localStorage.removeItem(`column-pin-${column.id}`);
      removeColumn(column.id);
    }
  };

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
  };

  const renderItem = (item: Status | Notification) => {
    if ('type' in item && item.type) {
      // Notification
      return (
        <div key={item.id} className="notification-item">
          <img src={item.account.avatarUrl} alt={item.account.username} className="avatar" />
          <div className="notification-content">
            <div className="display-name-container">
              <span className="display-name">{item.account.displayName}</span>
              <span className="username">@{item.account.username}</span>
            </div>
            <span className="notification-type">{item.type}</span>
            {item.status && (
              <div className="status-content">
                <p dangerouslySetInnerHTML={{ __html: item.status.content }} />
                {item.status.mediaAttachments.length > 0 && (
                  <div className="media-attachments">
                    {item.status.mediaAttachments.map(media => (
                      <img key={media.id} src={media.previewUrl} alt="" className="media-preview" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    } else {
      // Status
      return (
        <div key={item.id} className="status-item">
          <img src={item.account.avatarUrl} alt={item.account.username} className="avatar" />
          <div className="status-content">
            <div className="display-name-container">
              <span className="display-name">{item.account.displayName}</span>
              <span className="username">@{item.account.username}</span>
            </div>
            <p dangerouslySetInnerHTML={{ __html: item.content }} />
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
    <div className={`timeline-column ${isPinned ? 'pinned' : ''}`}>
      <div className="column-header">
        <div className="column-header-content">
          <h2>{column.title}</h2>
          <div className="column-actions">
            <button 
              className={`pin-button ${isPinned ? 'active' : ''}`}
              onClick={handleTogglePin}
              title={isPinned ? 'Unpin' : 'Pin'}
            >
              📌
            </button>
            <button 
              className="remove-button"
              onClick={handleRemoveColumn}
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>
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