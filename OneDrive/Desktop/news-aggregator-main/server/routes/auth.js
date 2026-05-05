const crypto = require("crypto");
const express = require("express");
const axios = require("axios");
const User = require("../models/User");
const Preference = require("../models/Preference");
const { createDefaultPreferences } = require("../models/preferenceModel");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} = require("../validators/authValidators");
const { signAuthToken, signOtpResetToken, verifyToken } = require("../utils/jwt");
const { sendOtpEmail } = require("../utils/email");
const { sendSuccess, sendError } = require("../utils/response");
const { requireAuth, requireDatabase } = require("../middleware/auth");

const router = express.Router();
const OTP_EXPIRE_MS = 10 * 60 * 1000;

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
  };
}

function parseSchema(schema, payload) {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      value: null,
      error: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
    };
  }
  return { value: parsed.data, error: null };
}

function hashOtp(otpCode) {
  return crypto.createHash("sha256").update(otpCode).digest("hex");
}

function generateOtpCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

async function ensureDefaultPreferencesForUser(userId) {
  const existing = await Preference.findOne({ user: userId });
  if (existing) {
    return existing;
  }

  const defaults = createDefaultPreferences();
  return Preference.create({
    user: userId,
    ...defaults,
  });
}

router.post("/register", requireDatabase, async (req, res) => {
  const { value, error } = parseSchema(registerSchema, req.body);
  if (error) {
    return sendError(res, 400, "Invalid registration input", error);
  }

  try {
    const existing = await User.findOne({ email: value.email.toLowerCase() });
    if (existing) {
      return sendError(res, 400, "Invalid registration input", "Email already exists");
    }

    const user = await User.create({
      name: value.name,
      email: value.email.toLowerCase(),
      password: value.password,
      authProvider: "local",
    });

    await ensureDefaultPreferencesForUser(user._id);

    const token = signAuthToken(user);
    return sendSuccess(res, 201, "Registration successful", {
      token,
      user: sanitizeUser(user),
    });
  } catch (dbError) {
    return sendError(res, 503, "Database unavailable", dbError.message);
  }
});

router.post("/login", requireDatabase, async (req, res) => {
  const { value, error } = parseSchema(loginSchema, req.body);
  if (error) {
    return sendError(res, 400, "Invalid login input", error);
  }

  try {
    const user = await User.findOne({ email: value.email.toLowerCase() }).select("+password");
    if (!user) {
      return sendError(res, 401, "Invalid credentials", "Email or password is incorrect");
    }

    const isMatch = await user.comparePassword(value.password);
    if (!isMatch) {
      return sendError(res, 401, "Invalid credentials", "Email or password is incorrect");
    }

    await ensureDefaultPreferencesForUser(user._id);
    const token = signAuthToken(user);
    return sendSuccess(res, 200, "Login successful", {
      token,
      user: sanitizeUser(user),
    });
  } catch (dbError) {
    return sendError(res, 503, "Database unavailable", dbError.message);
  }
});

router.get("/me", requireAuth, requireDatabase, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 401, "Authentication failed", "User not found");
    }
    return sendSuccess(res, 200, "Current user fetched", { user: sanitizeUser(user) });
  } catch (dbError) {
    return sendError(res, 503, "Database unavailable", dbError.message);
  }
});

router.post("/forgot-password", requireDatabase, async (req, res) => {
  const { value, error } = parseSchema(forgotPasswordSchema, req.body);
  if (error) {
    return sendError(res, 400, "Invalid forgot-password input", error);
  }

  const genericMessage = "If the email exists, an OTP has been sent.";

  try {
    const user = await User.findOne({ email: value.email.toLowerCase() }).select("+resetOtp +resetOtpExpires");

    if (!user) {
      return sendSuccess(res, 200, genericMessage, null);
    }

    const otpCode = generateOtpCode();
    user.resetOtp = hashOtp(otpCode);
    user.resetOtpExpires = new Date(Date.now() + OTP_EXPIRE_MS);
    await user.save();

    try {
      await sendOtpEmail(user.email, otpCode);
    } catch (emailError) {
      // Keep response generic to avoid account enumeration behavior.
      console.error("Failed to send OTP email:", emailError.message);
    }

    return sendSuccess(res, 200, genericMessage, null);
  } catch (dbError) {
    return sendError(res, 503, "Database unavailable", dbError.message);
  }
});

router.post("/verify-otp", requireDatabase, async (req, res) => {
  const { value, error } = parseSchema(verifyOtpSchema, req.body);
  if (error) {
    return sendError(res, 400, "Invalid OTP input", error);
  }

  try {
    const user = await User.findOne({ email: value.email.toLowerCase() }).select("+resetOtp +resetOtpExpires");
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return sendError(res, 401, "Invalid OTP", "Code is invalid or expired");
    }

    const hashed = hashOtp(value.otp);
    const isExpired = user.resetOtpExpires.getTime() < Date.now();
    if (user.resetOtp !== hashed || isExpired) {
      return sendError(res, 401, "Invalid OTP", "Code is invalid or expired");
    }

    const resetToken = signOtpResetToken(user.email);
    return sendSuccess(res, 200, "OTP verified", { resetToken });
  } catch (dbError) {
    return sendError(res, 503, "Database unavailable", dbError.message);
  }
});

router.post("/reset-password", requireDatabase, async (req, res) => {
  const { value, error } = parseSchema(resetPasswordSchema, req.body);
  if (error) {
    return sendError(res, 400, "Invalid reset-password input", error);
  }

  try {
    let payload;
    try {
      payload = verifyToken(value.resetToken);
    } catch (tokenError) {
      return sendError(res, 401, "Invalid reset token", "Token is invalid or expired");
    }

    if (payload.purpose !== "reset-password") {
      return sendError(res, 401, "Invalid reset token", "Token purpose mismatch");
    }

    const user = await User.findOne({ email: payload.email.toLowerCase() }).select("+resetOtp +resetOtpExpires +password");
    if (!user) {
      return sendError(res, 401, "Invalid reset token", "User not found");
    }

    user.password = value.password;
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    return sendSuccess(res, 200, "Password reset successful", null);
  } catch (dbError) {
    return sendError(res, 503, "Database unavailable", dbError.message);
  }
});

router.get("/google", (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.SERVER_URL) {
    return sendError(res, 503, "Google OAuth unavailable", "Google OAuth is not configured");
  }

  const redirectUri = `${process.env.SERVER_URL}/auth/google/callback`;
  const scope = encodeURIComponent("openid email profile");
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(process.env.GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
  return res.redirect(authUrl);
});

router.get("/google/callback", requireDatabase, async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.SERVER_URL || !process.env.CLIENT_URL) {
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/auth/callback?error=google_oauth_not_configured`);
  }

  try {
    const code = req.query.code;
    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=missing_google_code`);
    }

    const redirectUri = `${process.env.SERVER_URL}/auth/google/callback`;
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const profileResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
    });

    const profile = profileResponse.data;
    let user = await User.findOne({
      $or: [{ email: profile.email.toLowerCase() }, { providerId: profile.id, authProvider: "google" }],
    });

    if (!user) {
      user = await User.create({
        name: profile.name || "Google User",
        email: profile.email.toLowerCase(),
        password: crypto.randomBytes(32).toString("hex"),
        authProvider: "google",
        providerId: profile.id,
      });
      await ensureDefaultPreferencesForUser(user._id);
    }

    const token = signAuthToken(user);
    return res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (error) {
    return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=google_callback_failed`);
  }
});

router.get("/facebook", (req, res) => {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET || !process.env.SERVER_URL) {
    return sendError(res, 503, "Facebook OAuth unavailable", "Facebook OAuth is not configured");
  }

  const redirectUri = `${process.env.SERVER_URL}/auth/facebook/callback`;
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(process.env.FACEBOOK_APP_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email`;
  return res.redirect(authUrl);
});

router.get("/facebook/callback", requireDatabase, async (req, res) => {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET || !process.env.SERVER_URL || !process.env.CLIENT_URL) {
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/auth/callback?error=facebook_oauth_not_configured`);
  }

  try {
    const code = req.query.code;
    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=missing_facebook_code`);
    }

    const redirectUri = `${process.env.SERVER_URL}/auth/facebook/callback`;
    const tokenExchange = await axios.get("https://graph.facebook.com/v19.0/oauth/access_token", {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      },
    });

    const profileResponse = await axios.get("https://graph.facebook.com/me", {
      params: {
        fields: "id,name,email",
        access_token: tokenExchange.data.access_token,
      },
    });

    const profile = profileResponse.data;
    if (!profile.email) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=facebook_email_missing`);
    }

    let user = await User.findOne({
      $or: [{ email: profile.email.toLowerCase() }, { providerId: profile.id, authProvider: "facebook" }],
    });

    if (!user) {
      user = await User.create({
        name: profile.name || "Facebook User",
        email: profile.email.toLowerCase(),
        password: crypto.randomBytes(32).toString("hex"),
        authProvider: "facebook",
        providerId: profile.id,
      });
      await ensureDefaultPreferencesForUser(user._id);
    }

    const token = signAuthToken(user);
    return res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${encodeURIComponent(token)}`);
  } catch (error) {
    return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=facebook_callback_failed`);
  }
});

module.exports = router;
