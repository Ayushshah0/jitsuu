const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
}

function isDatabaseAvailable() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDatabase,
  isDatabaseAvailable,
};
