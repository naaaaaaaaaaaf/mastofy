import { useState } from 'react';
import { Status } from '../../types/timeline';
import { useAuth } from '../../contexts/AuthContext';
import { createClient, favoriteStatus, unfavoriteStatus, boostStatus, unboostStatus } from '../../services/mastodon';
import { formatRelativeTime } from '../../utils/time';
import './styles.css';

interface StatusProps {
  status: Status;
  onStatusUpdate?: (updatedStatus: Status) => void;
}

export default function StatusItem({ status: initialStatus, onStatusUpdate }: StatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState<string | null>(null);
  const [isCWExpanded, setIsCWExpanded] = useState(false);
  const { auth } = useAuth();

  // ブースト投稿の場合、実際の投稿内容を取得
  const actualStatus = status.reblog || status;

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

  const toggleCW = () => {
    setIsCWExpanded(!isCWExpanded);
  };

  return (
    <div className="status-item">
      {status.reblog && (
        <div className="boost-indicator">
          <span className="boost-icon">🔁</span>
          <span className="boost-text">{status.account.displayName} boosted</span>
        </div>
      )}
      <div className="status-main">
        <img src={actualStatus.account.avatarUrl} alt={actualStatus.account.username} className="avatar" />
        <div className="status-content">
          <div className="status-header">
            <div className="display-name-container">
              <span className="display-name">{actualStatus.account.displayName}</span>
              <span className="username">@{actualStatus.account.acct}</span>
            </div>
            <span className="timestamp" title={actualStatus.createdAt}>
              {formatRelativeTime(actualStatus.createdAt)}
            </span>
          </div>

          {actualStatus.spoilerText ? (
            <div className="content-warning">
              <div className="spoiler-text">{actualStatus.spoilerText}</div>
              <button onClick={toggleCW} className="toggle-cw-button">
                {isCWExpanded ? 'Hide' : 'Show more'}
              </button>
              {isCWExpanded && (
                <div className="content" dangerouslySetInnerHTML={{ __html: actualStatus.content }} />
              )}
            </div>
          ) : (
            <div className="content" dangerouslySetInnerHTML={{ __html: actualStatus.content }} />
          )}
          
          {actualStatus.mediaAttachments.length > 0 && (
            <div className={`media-attachments ${actualStatus.sensitive && !isCWExpanded ? 'sensitive' : ''}`}>
              {actualStatus.mediaAttachments.map(media => (
                <div key={media.id} className="media-attachment-container">
                  <img
                    src={media.previewUrl}
                    alt=""
                    className="media-preview"
                    onClick={() => !actualStatus.sensitive || isCWExpanded ? handleMediaClick(media.url) : null}
                  />
                  {actualStatus.sensitive && !isCWExpanded && (
                    <div className="sensitive-overlay">
                      <button onClick={toggleCW}>Show sensitive content</button>
                    </div>
                  )}
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