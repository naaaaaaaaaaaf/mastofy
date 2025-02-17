import { useState } from 'react';
import { Status } from '../../types/timeline';
import { useAuth } from '../../contexts/AuthContext';
import { createClient, favoriteStatus, unfavoriteStatus, boostStatus, unboostStatus } from '../../services/mastodon';

interface StatusProps {
  status: Status;
  onStatusUpdate?: (updatedStatus: Status) => void;
}

export default function StatusItem({ status: initialStatus, onStatusUpdate }: StatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState<string | null>(null);
  const { auth } = useAuth();

  const handleFavorite = async () => {
    if (!auth.accessToken || !auth.instance || isLoading) return;

    setIsLoading(true);
    try {
      const client = createClient(auth.instance, auth.accessToken);
      const updatedStatus = status.favorited
        ? await unfavoriteStatus(client, status.id)
        : await favoriteStatus(client, status.id);
      
      setStatus(updatedStatus);
      onStatusUpdate?.(updatedStatus);
    } catch (error) {
      console.error('Failed to favorite/unfavorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoost = async () => {
    if (!auth.accessToken || !auth.instance || isLoading) return;

    setIsLoading(true);
    try {
      const client = createClient(auth.instance, auth.accessToken);
      const updatedStatus = status.reblogged
        ? await unboostStatus(client, status.id)
        : await boostStatus(client, status.id);
      
      setStatus(updatedStatus);
      onStatusUpdate?.(updatedStatus);
    } catch (error) {
      console.error('Failed to boost/unboost:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaClick = (url: string) => {
    setExpandedMedia(url);
  };

  return (
    <div className="status-item">
      <img src={status.account.avatarUrl} alt={status.account.username} className="avatar" />
      <div className="status-content">
        <div className="display-name-container">
          <span className="display-name">{status.account.displayName}</span>
          <span className="username">@{status.account.username}</span>
        </div>
        <p dangerouslySetInnerHTML={{ __html: status.content }} />
        
        {status.mediaAttachments.length > 0 && (
          <div className="media-attachments">
            {status.mediaAttachments.map(media => (
              <div key={media.id} className="media-attachment-container">
                <img
                  src={media.previewUrl}
                  alt=""
                  className="media-preview"
                  onClick={() => handleMediaClick(media.url)}
                />
              </div>
            ))}
          </div>
        )}

        <div className="status-actions">
          <button
            onClick={handleFavorite}
            className={`action-button favorite-button ${status.favorited ? 'active' : ''}`}
            disabled={isLoading}
          >
            {status.favorited ? '★' : '☆'}
            {status.favouritesCount > 0 && (
              <span className="count">{status.favouritesCount}</span>
            )}
          </button>
          <button
            onClick={handleBoost}
            className={`action-button boost-button ${status.reblogged ? 'active' : ''}`}
            disabled={isLoading}
          >
            {status.reblogged ? '🔁' : '↺'}
            {status.reblogsCount > 0 && (
              <span className="count">{status.reblogsCount}</span>
            )}
          </button>
        </div>
      </div>

      {expandedMedia && (
        <div className="media-overlay" onClick={() => setExpandedMedia(null)}>
          <div className="media-modal">
            <img src={expandedMedia} alt="" className="expanded-media" />
            <button className="close-modal" onClick={() => setExpandedMedia(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}