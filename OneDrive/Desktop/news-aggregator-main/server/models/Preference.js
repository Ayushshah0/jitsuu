const mongoose = require("mongoose");
const {
  AVAILABLE_CATEGORIES,
  AVAILABLE_COUNTRIES,
  AVAILABLE_LANGUAGES,
  createDefaultPreferences,
} = require("./preferenceModel");

const notificationChannelSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ["instant", "daily", "weekly"],
      default: undefined,
    },
  },
  { _id: false }
);

const preferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    categories: {
      type: [String],
      enum: AVAILABLE_CATEGORIES,
      default: createDefaultPreferences().categories,
    },
    country: {
      type: String,
      enum: AVAILABLE_COUNTRIES,
      default: createDefaultPreferences().country,
    },
    language: {
      type: String,
      enum: AVAILABLE_LANGUAGES,
      default: createDefaultPreferences().language,
    },
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: createDefaultPreferences().theme,
    },
    keywords: {
      type: [String],
      default: createDefaultPreferences().keywords,
    },
    notifications: {
      inApp: { type: notificationChannelSchema, default: createDefaultPreferences().notifications.inApp },
      email: { type: notificationChannelSchema, default: createDefaultPreferences().notifications.email },
      push: { type: notificationChannelSchema, default: createDefaultPreferences().notifications.push },
      browser: { type: notificationChannelSchema, default: createDefaultPreferences().notifications.browser },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Preference", preferenceSchema);
