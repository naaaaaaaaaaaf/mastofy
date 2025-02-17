import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useColumns } from '../../contexts/ColumnContext';
import { createClient, getHomeTimeline, getLocalTimeline, getPublicTimeline, getNotifications, getHashtagTimeline } from '../../services/mastodon';
import { Column } from '../../types/column';
import { Status, Notification } from '../../types/timeline';
import ComposeForm from '../ComposeForm';
import StatusItem from '../StatusItem';

interface ColumnProps {
  column: Column;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

export default function TimelineColumn({ column, index, isFirst, isLast }: ColumnProps) {
  const [items, setItems] = useState<(Status | Notification)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem(`column-pin-${column.id}`);
    return saved === 'true';
  });
  const { auth } = useAuth();
  const { removeColumn, moveColumn } = useColumns();

  const fetchData = useCallback(async (isUpdate = false) => {
    if (!auth.accessToken || !auth.instance) return;

    setIsLoading(!isUpdate); // 更新時はローディング表示しない
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

      // 新しい投稿が上に来るように並び替え
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      if (isUpdate) {
        // 更新時は既存のアイテムと統合
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = sortedData.filter(item => !existingIds.has(item.id));
          return [...newItems, ...prev];
        });
      } else {
        setItems(sortedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Failed to fetch timeline:', err);
    } finally {
      setIsLoading(false);
    }
  }, [column, auth.accessToken, auth.instance]);

  useEffect(() => {
    fetchData();
    
    // より頻繁な更新のために間隔を短くする
    const intervalId = setInterval(() => fetchData(true), 10000); // 10秒ごとに更新

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

  const handleMoveLeft = () => {
    if (!isFirst) {
      moveColumn(index, index - 1);
    }
  };

  const handleMoveRight = () => {
    if (!isLast) {
      moveColumn(index, index + 1);
    }
  };

  const updateStatus = (updatedStatus: Status) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if ('type' in item) {
          // 通知の場合、通知内のステータスも更新
          return item.status?.id === updatedStatus.id
            ? { ...item, status: updatedStatus }
            : item;
        }
        // 通常の投稿の場合
        return item.id === updatedStatus.id ? updatedStatus : item;
      })
    );
  };

  const handleNewStatus = (status: Status) => {
    setItems(prev => [status, ...prev]);
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
            {item.status && <StatusItem key={item.status.id} status={item.status} onStatusUpdate={updateStatus} />}
          </div>
        </div>
      );
    } else {
      // Status - add type assertion since we know it's a Status at this point
      return <StatusItem key={item.id} status={item as Status} onStatusUpdate={updateStatus} />;
    }
  };

  return (
    <div className={`timeline-column ${isPinned ? 'pinned' : ''}`}>
      <div className="column-header">
        <div className="column-header-content">
          <div className="column-title">
            <h2>{column.title}</h2>
          </div>
          <div className="column-actions">
            {!isFirst && (
              <button 
                className="move-button"
                onClick={handleMoveLeft}
                title="Move Left"
              >
                ◀
              </button>
            )}
            {!isLast && (
              <button 
                className="move-button"
                onClick={handleMoveRight}
                title="Move Right"
              >
                ▶
              </button>
            )}
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
        {column.type === 'home' && <ComposeForm onStatusPosted={handleNewStatus} />}
        {isLoading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}
        <div className="items-list">
          {items.map(renderItem)}
        </div>
      </div>
    </div>
  );
}