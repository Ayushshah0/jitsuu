const jwt = require("jsonwebtoken");

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev_secret_change_me";
}

function getJwtExpire() {
  return process.env.JWT_EXPIRE || "7d";
}

function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: getJwtExpire() }
  );
}

function signOtpResetToken(email) {
  return jwt.sign(
    {
      purpose: "reset-password",
      email,
    },
    getJwtSecret(),
    { expiresIn: "15m" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  signAuthToken,
  signOtpResetToken,
  verifyToken,
};
