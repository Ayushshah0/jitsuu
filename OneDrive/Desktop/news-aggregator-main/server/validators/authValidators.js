const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().regex(/^\d{6}$/),
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(10),
  password: z.string().min(6).max(128),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
};
