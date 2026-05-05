const nodemailer = require("nodemailer");

function canSendEmail() {
  return Boolean(process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function buildTransport() {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendOtpEmail(to, otpCode) {
  if (!canSendEmail()) {
    return false;
  }

  const transporter = buildTransport();
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Your News App Password Reset OTP",
    text: `Use this OTP to reset your password: ${otpCode}. It expires in 10 minutes.`,
  });

  return true;
}

module.exports = {
  sendOtpEmail,
};
