import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate("/");
    } catch (error) {
      if (error?.status === 401) {
        setErrorMessage("Invalid email or password.");
      } else if (error?.status === 503) {
        setErrorMessage("Service unavailable. Please try again later.");
      } else {
        setErrorMessage(error?.payload?.error || "Unable to login right now.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-10 flex flex-col gap-6"
        aria-label="Login Card"
      >
        <h1 className="text-3xl font-serif font-bold text-center text-gray-800 dark:text-gray-100 mb-2 select-none">
          Login
        </h1>
        <form className="flex flex-col gap-5" autoComplete="off" aria-label="Login Form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f5f5f5] dark:bg-gray-700 px-4 py-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm"
              placeholder="you@example.com"
              aria-label="Email"
            />
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-[#f5f5f5] dark:bg-gray-700 px-4 py-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm pr-12"
              placeholder="••••••••"
              aria-label="Password"
            />
            <button
              type="button"
              tabIndex={0}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-9 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 focus:text-blue-500 focus:outline-none transition-colors"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
            <div className="flex justify-end mt-1">
              <Link
                to="/forgot-password"
                className="text-xs text-blue-500 hover:underline focus:underline focus:outline-none transition-colors"
                tabIndex={0}
              >
                Forgot Password?
              </Link>
            </div>
          </div>
          {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
            aria-label="Login"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </motion.button>
        </form>
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 select-none">or continue with</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => window.location.assign(`${API_BASE_URL}/auth/google`)}
            className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-100 font-medium shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Continue with Google"
          >
            <FcGoogle className="h-5 w-5" aria-hidden="true" />
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => window.location.assign(`${API_BASE_URL}/auth/facebook`)}
            className="flex items-center justify-center gap-3 w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 font-medium shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Continue with Facebook"
          >
            <FaFacebook className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            Continue with Facebook
          </button>
        </div>
        <div className="text-xs text-gray-400 text-center mt-2 select-none">
          Google and Facebook icons are shown here for upcoming social login support.
        </div>
        <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-300">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline focus:underline focus:outline-none transition-colors"
            tabIndex={0}
          >
            Register here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
