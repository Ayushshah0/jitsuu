import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { isHydrating, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isHydrating) {
    return <div className="mt-24 px-4 md:px-10 lg:px-16">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
