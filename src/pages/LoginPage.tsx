import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAuthorizationUrl, getAccessToken } from '../services/mastodon';

export default function LoginPage() {
  const [instance, setInstance] = useState('');
  const [code, setCode] = useState('');
  const [authUrl, setAuthUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 認証情報が既に存在する場合はホームページにリダイレクト
    if (auth.accessToken && auth.instance) {
      navigate('/home');
    }
  }, [auth.accessToken, auth.instance, navigate]);

  const handleGetAuthUrl = async () => {
    if (!instance) return;
    
    setIsLoading(true);
    try {
      const url = await getAuthorizationUrl(instance);
      setAuthUrl(url);
      // Open the auth URL in a new window
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to get authorization URL:', error);
      alert('Failed to connect to instance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!instance || !code) return;

    setIsLoading(true);
    try {
      const accessToken = await getAccessToken(instance, code);
      setAuth({
        accessToken,
        instance,
      });
      navigate('/home');
    } catch (error) {
      console.error('Failed to login:', error);
      alert('Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1>Login to Mastodon</h1>
      <div className="login-form">
        <div className="form-group">
          <label htmlFor="instance">Instance URL:</label>
          <input
            type="text"
            id="instance"
            placeholder="e.g., mastodon.social"
            value={instance}
            onChange={(e) => setInstance(e.target.value)}
          />
          <button onClick={handleGetAuthUrl} disabled={!instance || isLoading}>
            Connect to Instance
          </button>
        </div>

        {authUrl && (
          <div className="form-group">
            <label htmlFor="code">Authorization Code:</label>
            <input
              type="text"
              id="code"
              placeholder="Enter the code from authorization page"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button onClick={handleLogin} disabled={!code || isLoading}>
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}