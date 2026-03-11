import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import '../styles/Auth.css';

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await register(name, email, password);
      navigate('/login');
    } catch (err) {
      if (err.response?.status === 503) {
        setError('Registration is unavailable because the database is not connected yet. Please check MongoDB Atlas access and try again.');
        return;
      }

      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Register</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true">
                    <path fill="currentColor" d="M3.3 4.7 2 6l4.1 4.1C4.2 11.4 2.8 13 2 14c2.1 3.4 5.8 5.5 10 5.5 1.8 0 3.5-.4 5-1.1l4 4 1.3-1.3zM12 17.5c-2.8 0-5.4-1.5-7-3.9.6-.8 1.6-2 3-2.9l1.5 1.5a3.5 3.5 0 0 0 4.3 4.3l1.7 1.7c-1 .4-2.1.6-3.5.6zm0-11c4.2 0 7.9 2.1 10 5.5-.7 1.1-2.1 2.8-4.3 4l-1.5-1.5A3.5 3.5 0 0 0 11 9.3L9.7 8A9.5 9.5 0 0 1 12 6.5zm0 2a3.5 3.5 0 0 1 3.5 3.5c0 .4-.1.8-.2 1.2l-4.5-4.5c.4-.1.8-.2 1.2-.2zm-3.5 3.5c0-.4.1-.8.2-1.2l4.5 4.5c-.4.1-.8.2-1.2.2A3.5 3.5 0 0 1 8.5 12z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" role="img" focusable="false" aria-hidden="true">
                    <path fill="currentColor" d="M12 5c4.6 0 8.5 2.8 10 7-1.5 4.2-5.4 7-10 7S3.5 16.2 2 12c1.5-4.2 5.4-7 10-7zm0 2c-3.4 0-6.4 2-7.9 5 1.5 3 4.5 5 7.9 5s6.4-2 7.9-5c-1.5-3-4.5-5-7.9-5zm0 1.8A3.2 3.2 0 1 1 8.8 12 3.2 3.2 0 0 1 12 8.8zm0 2A1.2 1.2 0 1 0 13.2 12 1.2 1.2 0 0 0 12 10.8z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" className="auth-button">Register</button>
        </form>
        <div className="auth-divider">
          <span>or sign up with</span>
        </div>
        <div className="social-auth">
          <button type="button" className="social-button google-button" disabled>
            <span className="social-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.6 14.5 2.8 12 2.8A9.2 9.2 0 0 0 2.7 12 9.2 9.2 0 0 0 12 21.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.1-1.5z"/>
                <path fill="#34A853" d="M3.8 7.7 7 10.1C7.9 7.9 9.8 6.3 12 6.3c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.6 3.6 14.5 2.8 12 2.8c-3.5 0-6.6 2-8.2 4.9z"/>
                <path fill="#4A90E2" d="M12 21.2c2.4 0 4.5-.8 6-2.3l-2.8-2.2c-.8.6-1.8 1-3.2 1-3.7 0-5.2-2.5-5.4-3.8l-3.1 2.4c1.5 3 4.6 4.9 8.5 4.9z"/>
                <path fill="#FBBC05" d="M3.5 16.3 6.7 14c-.2-.6-.4-1.2-.4-2s.1-1.4.4-2L3.5 7.7A9.1 9.1 0 0 0 2.7 12c0 1.6.3 3.1.8 4.3z"/>
              </svg>
            </span>
            Continue with Google
          </button>
          <button type="button" className="social-button facebook-button" disabled>
            <span className="social-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img" focusable="false">
                <path fill="currentColor" d="M13.7 21v-7.7h2.6l.4-3h-3V8.4c0-.9.3-1.4 1.6-1.4h1.5V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2.2H8v3h2.7V21z"/>
              </svg>
            </span>
            Continue with Facebook
          </button>
        </div>
        <p className="auth-helper-text">Google and Facebook icons are shown here for upcoming social signup support.</p>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
