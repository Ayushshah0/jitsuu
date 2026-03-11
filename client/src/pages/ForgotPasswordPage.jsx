import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/newsService';
import '../styles/Auth.css';

function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setSuccess('Code verified! Set your new password.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email, otp, newPassword });
      setSuccess(res.data.message);
      setError(null);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Forgot Password</h2>

        {/* Step indicator */}
        <div className="fp-steps">
          <div className={`fp-step ${step >= 1 ? 'active' : ''}`}>
            <span className="fp-step-num">1</span>
            <span className="fp-step-label">Email</span>
          </div>
          <div className="fp-step-line" />
          <div className={`fp-step ${step >= 2 ? 'active' : ''}`}>
            <span className="fp-step-num">2</span>
            <span className="fp-step-label">Verify</span>
          </div>
          <div className="fp-step-line" />
          <div className={`fp-step ${step >= 3 ? 'active' : ''}`}>
            <span className="fp-step-num">3</span>
            <span className="fp-step-label">Reset</span>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {/* Step 1: Enter email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="auth-form">
            <p className="fp-description">Enter your registered email address. We'll send a verification code to reset your password.</p>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <p className="fp-description">A 6-digit verification code has been sent to <strong>{email}</strong>. Check your inbox (and spam folder).</p>
            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="otp-input"
                required
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              className="fp-resend-btn"
              onClick={handleSendOtp}
              disabled={loading}
            >
              Resend Code
            </button>
          </form>
        )}

        {/* Step 3: New password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <p className="fp-description">Create your new password.</p>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                />
              </div>
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Remember your password? <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
