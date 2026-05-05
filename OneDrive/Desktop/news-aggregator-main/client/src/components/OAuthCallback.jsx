import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuthenticatedSession } = useAuth();
  const [message, setMessage] = useState("Processing social login...");

  useEffect(() => {
    async function applyCallback() {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error || !token) {
        setMessage("Social login failed. Redirecting to login.");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
        return;
      }

      try {
        await setAuthenticatedSession(token);
        navigate("/", { replace: true });
      } catch (callbackError) {
        setMessage("Could not complete login. Redirecting...");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      }
    }

    applyCallback();
  }, [navigate, searchParams, setAuthenticatedSession]);

  return (
    <section className="mt-24 px-4 md:px-10 lg:px-16">
      <p>{message}</p>
    </section>
  );
}

export default OAuthCallback;
