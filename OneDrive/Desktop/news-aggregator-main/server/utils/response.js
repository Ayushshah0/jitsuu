function sendSuccess(res, status, message, data) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function sendError(res, status, message, error) {
  return res.status(status).json({
    success: false,
    message,
    error,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
