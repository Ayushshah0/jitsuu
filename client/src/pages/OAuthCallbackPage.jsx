import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import '../styles/Auth.css';

function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthenticatedSession } = useContext(AuthContext);
  const [message, setMessage] = useState('Completing sign in...');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/login?oauthError=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!token) {
      navigate('/login?oauthError=Missing%20social%20login%20token.', { replace: true });
      return;
    }

    setAuthenticatedSession(token)
      .then(() => {
        navigate('/', { replace: true });
      })
      .catch(() => {
        setMessage('Could not complete social sign in. Redirecting to login...');
        setTimeout(() => {
          navigate('/login?oauthError=Could%20not%20complete%20social%20login.', { replace: true });
        }, 1200);
      });
  }, [navigate, searchParams, setAuthenticatedSession]);

  return (
    <div className="auth-page">
      <div className="auth-container auth-status-card">
        <h2>Social Login</h2>
        <p className="auth-helper-text auth-status-text">{message}</p>
      </div>
    </div>
  );
}

export default OAuthCallbackPage;
