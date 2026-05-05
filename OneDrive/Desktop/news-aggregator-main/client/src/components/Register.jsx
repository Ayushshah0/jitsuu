import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!form.name.trim()) {
      setErrorMessage("Name is required.");
      return;
    }

    if (!form.email.includes("@")) {
      setErrorMessage("A valid email is required.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password);
      navigate("/");
    } catch (error) {
      if (error?.status === 503) {
        setErrorMessage("Service unavailable. Please try again shortly.");
      } else {
        setErrorMessage(error?.payload?.error || "Registration failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md rounded-2xl border border-sky-300/30 bg-slate-900/40 p-6 md:p-8">
        <h2 className="text-3xl font-semibold mb-5">Create account</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="register-name" className="block mb-1">Name</label>
            <input
              id="register-name"
              type="text"
              className="w-full rounded-lg bg-slate-800 border border-sky-300/40 p-3"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="register-email" className="block mb-1">Email</label>
            <input
              id="register-email"
              type="email"
              className="w-full rounded-lg bg-slate-800 border border-sky-300/40 p-3"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="register-password" className="block mb-1">Password</label>
            <input
              id="register-password"
              type="password"
              className="w-full rounded-lg bg-slate-800 border border-sky-300/40 p-3"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>

          {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}

          <button type="submit" className="btn w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm">
          Already have an account? <Link to="/login" className="underline">Login</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
