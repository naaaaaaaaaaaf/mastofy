import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createClient, postStatus, uploadMedia } from '../../services/mastodon';
import { Status } from '../../types/timeline';

interface ComposeFormProps {
  onStatusPosted?: (status: Status) => void;
}

export default function ComposeForm({ onStatusPosted }: ComposeFormProps) {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ id: string; preview: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { auth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.accessToken || !auth.instance || !content.trim() || isUploading) return;

    setIsPosting(true);
    setError(null);

    try {
      const client = createClient(auth.instance, auth.accessToken);
      const newStatus = await postStatus(client, content, mediaFiles.map(f => f.id));
      setContent('');
      setMediaFiles([]);
      onStatusPosted?.(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post status');
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !auth.accessToken || !auth.instance || mediaFiles.length + files.length > 4) {
      alert('You can only attach up to 4 media files');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const client = createClient(auth.instance, auth.accessToken);
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          const response = await uploadMedia(client, file);
          return {
            id: response.id,
            preview: response.preview_url,
          };
        })
      );
      setMediaFiles(prev => [...prev, ...uploads]);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload media');
    } finally {
      setIsUploading(false);
    }
  }, [auth.accessToken, auth.instance, mediaFiles.length]);

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const canSubmit = content.trim().length > 0 && !isPosting && !isUploading;

  return (
    <form onSubmit={handleSubmit} className="compose-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        disabled={isPosting || isUploading}
      />
      
      {mediaFiles.length > 0 && (
        <div className="media-previews">
          {mediaFiles.map((file, index) => (
            <div key={file.id} className="media-preview-container">
              <img src={file.preview} alt="" className="media-preview" />
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="remove-media"
                title="Remove media"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="compose-actions">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPosting || isUploading || mediaFiles.length >= 4}
          className="attach-button"
          title={mediaFiles.length >= 4 ? 'Maximum 4 files allowed' : 'Attach media'}
        >
          {isUploading ? '📤' : '📎'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="post-button"
        >
          {isPosting ? 'Posting...' : 'Post'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
    </form>
  );
}