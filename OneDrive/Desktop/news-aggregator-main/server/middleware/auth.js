const { verifyToken } = require("../utils/jwt");
const { isDatabaseAvailable } = require("../config/db");
const { sendError } = require("../utils/response");

function requireDatabase(req, res, next) {
  if (!isDatabaseAvailable()) {
    return sendError(res, 503, "Database unavailable", "Unable to connect to database");
  }
  return next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return sendError(res, 401, "Authentication required", "Missing or invalid authorization header");
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Session expired", "Token expired");
    }
    return sendError(res, 401, "Authentication failed", "Invalid token");
  }
}

module.exports = {
  requireAuth,
  requireDatabase,
};
