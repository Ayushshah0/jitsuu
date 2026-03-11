const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Preference = require('../models/Preference');
const authMiddleware = require('../middleware/authMiddleware');

// Email transporter (lazy-initialised on first use)
let _transporter = null;
function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return _transporter;
}

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:2100';

const getServerUrl = (req) => process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;

const ensurePreference = async (userId) => {
  const existingPreference = await Preference.findOne({ userId });
  if (!existingPreference) {
    await Preference.create({ userId });
  }
};

const ensureDatabaseReady = (res) => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  res.status(503).json({
    success: false,
    message: 'Database connection unavailable. Check MongoDB Atlas network access or credentials and try again.'
  });

  return false;
};

const buildAuthPayload = (user) => ({
  user: {
    id: user._id,
    name: user.name,
    email: user.email
  },
  token: generateToken(user._id)
});

const redirectWithError = (res, message) => {
  const redirectUrl = `${getClientUrl()}/oauth/callback?error=${encodeURIComponent(message)}`;
  return res.redirect(redirectUrl);
};

const redirectWithToken = (res, token) => {
  const redirectUrl = `${getClientUrl()}/oauth/callback?token=${encodeURIComponent(token)}`;
  return res.redirect(redirectUrl);
};

const findOrCreateSocialUser = async ({ email, name, authProvider, providerId }) => {
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      password: crypto.randomBytes(24).toString('hex'),
      authProvider,
      providerId
    });
    await ensurePreference(user._id);
    return user;
  }

  let shouldSave = false;

  if (!user.authProvider || user.authProvider === 'local') {
    user.authProvider = authProvider;
    shouldSave = true;
  }

  if (!user.providerId) {
    user.providerId = providerId;
    shouldSave = true;
  }

  if (shouldSave) {
    await user.save();
  }

  await ensurePreference(user._id);
  return user;
};

// @route   POST /auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Create default preferences for the user
    await ensurePreference(user._id);

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
});

// @route   POST /auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

// @route   GET /auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) {
      return;
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

router.get('/google', async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return redirectWithError(res, 'Google login is not configured yet.');
  }

  const redirectUri = `${getServerUrl(req)}/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account'
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      return redirectWithError(res, `Google login failed: ${error}`);
    }

    if (!code) {
      return redirectWithError(res, 'Google login failed: missing authorization code.');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return redirectWithError(res, 'Google login is not configured yet.');
    }

    const redirectUri = `${getServerUrl(req)}/auth/google/callback`;
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const profile = userInfoResponse.data;

    if (!profile.email) {
      return redirectWithError(res, 'Google account did not return an email address.');
    }

    const user = await findOrCreateSocialUser({
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      authProvider: 'google',
      providerId: profile.sub
    });

    const payload = buildAuthPayload(user);
    return redirectWithToken(res, payload.token);
  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    return redirectWithError(res, 'Google login failed. Please try again.');
  }
});

router.get('/facebook', async (req, res) => {
  const appId = process.env.FACEBOOK_APP_ID;

  if (!appId) {
    return redirectWithError(res, 'Facebook login is not configured yet.');
  }

  const redirectUri = `${getServerUrl(req)}/auth/facebook/callback`;
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email,public_profile'
  });

  return res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`);
});

router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, error, error_message: errorMessage } = req.query;

    if (error) {
      return redirectWithError(res, `Facebook login failed: ${errorMessage || error}`);
    }

    if (!code) {
      return redirectWithError(res, 'Facebook login failed: missing authorization code.');
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      return redirectWithError(res, 'Facebook login is not configured yet.');
    }

    const redirectUri = `${getServerUrl(req)}/auth/facebook/callback`;
    const tokenResponse = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code
      }
    });

    const accessToken = tokenResponse.data.access_token;
    const profileResponse = await axios.get('https://graph.facebook.com/me', {
      params: {
        fields: 'id,name,email',
        access_token: accessToken
      }
    });

    const profile = profileResponse.data;

    if (!profile.email) {
      return redirectWithError(res, 'Facebook account did not return an email address.');
    }

    const user = await findOrCreateSocialUser({
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      authProvider: 'facebook',
      providerId: profile.id
    });

    const payload = buildAuthPayload(user);
    return redirectWithToken(res, payload.token);
  } catch (error) {
    console.error('Facebook OAuth error:', error.response?.data || error.message);
    return redirectWithError(res, 'Facebook login failed. Please try again.');
  }
});

// ── Forgot Password: send OTP ──
router.post('/forgot-password', async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) return;

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether the email exists
      return res.json({ success: true, message: 'If that email is registered, a verification code has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.resetOtp = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save({ validateModifiedOnly: true });

    // Send email
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"NEWS-MANIA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Code - NEWS-MANIA',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px">
          <h2 style="color:#646cff;text-align:center">NEWS-MANIA</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your password reset verification code is:</p>
          <div style="text-align:center;margin:24px 0">
            <span style="font-size:32px;letter-spacing:8px;font-weight:700;color:#646cff;background:#eef;padding:12px 24px;border-radius:8px">${otp}</span>
          </div>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p style="color:#999;font-size:0.85rem">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'If that email is registered, a verification code has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code. Please try again.' });
  }
});

// ── Verify OTP ──
router.post('/verify-otp', async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) return;

    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and verification code' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpires');

    if (!user || !user.resetOtp || user.resetOtp !== hashedOtp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    res.json({ success: true, message: 'Code verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
});

// ── Reset Password ──
router.post('/reset-password', async (req, res) => {
  try {
    if (!ensureDatabaseReady(res)) return;

    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, verification code and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpires +password');

    if (!user || !user.resetOtp || user.resetOtp !== hashedOtp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    if (user.resetOtpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
  }
});

module.exports = router;

