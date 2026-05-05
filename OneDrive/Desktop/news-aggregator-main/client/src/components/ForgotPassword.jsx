import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  async function sendOtp(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to send OTP");
      }
      setStatus({ type: "success", message: payload.message || "OTP sent." });
      setStep(2);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Invalid OTP");
      }
      setResetToken(payload.data.resetToken);
      setStatus({ type: "success", message: "OTP verified." });
      setStep(3);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (password.length < 6) {
      setStatus({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match." });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Reset failed");
      }
      setStatus({ type: "success", message: "Password reset successful. Redirecting to login..." });
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-24 px-4 md:px-10 lg:px-16 pb-10">
      <div className="max-w-md mx-auto rounded-2xl border border-sky-300/30 bg-slate-900/40 p-6 md:p-8">
        <h2 className="text-3xl font-semibold mb-2">Forgot password</h2>
        <p className="opacity-80 mb-5">Step {step} of 3</p>

        {status.message && (
          <div className={`mb-4 rounded-lg p-3 text-sm ${status.type === "error" ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"}`}>
            {status.message}
          </div>
        )}

        {step === 1 && (
          <form className="space-y-4" onSubmit={sendOtp}>
            <div>
              <label htmlFor="forgot-email" className="block mb-1">Email</label>
              <input
                id="forgot-email"
                type="email"
                className="w-full rounded-lg bg-slate-800 border border-sky-300/40 p-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-4" onSubmit={verifyOtp}>
            <div>
              <label htmlFor="forgot-otp" className="block mb-1">Enter OTP</label>
              <input
                id="forgot-otp"
                type="text"
                className="w-full rounded-lg bg-slate-800 border border-sky-300/40 p-3"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                pattern="[0-9]{6}"
                required
              />
            </div>
            <button type="submit" className="btn w-full" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="space-y-4" onSubmit={resetPassword}>
            <div>
              <label htmlFor="new-password" className="block mb-1">New password</label>
              <input
                id="new-password"
                type="password"
                className="w-full rounded-lg bg-slate-800 border border-sky-300/40 p-3"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block mb-1">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                className="w-full rounded-lg bg-slate-800 border border-sky-300/40 p-3"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn w-full" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default ForgotPassword;
