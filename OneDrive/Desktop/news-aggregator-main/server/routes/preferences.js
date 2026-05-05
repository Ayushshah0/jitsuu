const express = require("express");
const { z } = require("zod");
const {
  AVAILABLE_CATEGORIES,
  AVAILABLE_COUNTRIES,
  AVAILABLE_LANGUAGES,
  AVAILABLE_KEYWORDS,
  preferenceSchema,
  themePatchSchema,
  notificationsPatchSchema,
  keywordsPatchSchema,
  createDefaultPreferences,
} = require("../models/preferenceModel");
const Preference = require("../models/Preference");
const { requireAuth, requireDatabase } = require("../middleware/auth");
const { sendSuccess, sendError } = require("../utils/response");

const router = express.Router();

function parseWithSchema(schema, payload) {
  try {
    return { value: schema.parse(payload), issues: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        value: null,
        issues: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      };
    }
    return { value: null, issues: "Validation failed" };
  }
}

router.get("/available", (req, res) => {
  return sendSuccess(res, 200, "Available preferences fetched", {
    categories: AVAILABLE_CATEGORIES,
    countries: AVAILABLE_COUNTRIES,
    languages: AVAILABLE_LANGUAGES,
    keywords: AVAILABLE_KEYWORDS,
    themes: ["light", "dark", "auto"],
    frequencies: ["instant", "daily", "weekly"],
  });
});

async function getOrCreatePreferences(userId) {
  let preference = await Preference.findOne({ user: userId });
  if (!preference) {
    const defaults = createDefaultPreferences();
    preference = await Preference.create({ user: userId, ...defaults });
  }
  return preference;
}

async function savePreferences(req, res) {
  const { value, issues } = parseWithSchema(preferenceSchema, req.body);
  if (issues) {
    return sendError(res, 400, "Invalid preference payload", issues);
  }

  try {
    const updated = await Preference.findOneAndUpdate(
      { user: req.user.id },
      { $set: value },
      { new: true, upsert: true }
    );
    return sendSuccess(res, 200, "Preferences updated", updated);
  } catch (error) {
    return sendError(res, 503, "Database unavailable", error.message);
  }
}

router.get("/", requireAuth, requireDatabase, async (req, res) => {
  try {
    const preferences = await getOrCreatePreferences(req.user.id);
    return sendSuccess(res, 200, "Preferences fetched", preferences);
  } catch (error) {
    return sendError(res, 503, "Database unavailable", error.message);
  }
});

router.put("/", requireAuth, requireDatabase, savePreferences);
router.post("/", requireAuth, requireDatabase, savePreferences);

router.patch("/theme", requireAuth, requireDatabase, async (req, res) => {
  const { value, issues } = parseWithSchema(themePatchSchema, req.body);
  if (issues) {
    return sendError(res, 400, "Invalid theme payload", issues);
  }

  try {
    await getOrCreatePreferences(req.user.id);
    const updated = await Preference.findOneAndUpdate(
      { user: req.user.id },
      { $set: { theme: value.theme } },
      { new: true }
    );
    return sendSuccess(res, 200, "Theme updated", updated);
  } catch (error) {
    return sendError(res, 503, "Database unavailable", error.message);
  }
});

router.patch("/notifications", requireAuth, requireDatabase, async (req, res) => {
  const { value, issues } = parseWithSchema(notificationsPatchSchema, req.body);
  if (issues) {
    return sendError(res, 400, "Invalid notifications payload", issues);
  }

  try {
    await getOrCreatePreferences(req.user.id);
    const updated = await Preference.findOneAndUpdate(
      { user: req.user.id },
      { $set: { notifications: value.notifications } },
      { new: true }
    );
    return sendSuccess(res, 200, "Notifications updated", updated);
  } catch (error) {
    return sendError(res, 503, "Database unavailable", error.message);
  }
});

router.patch("/keywords", requireAuth, requireDatabase, async (req, res) => {
  const { value, issues } = parseWithSchema(keywordsPatchSchema, req.body);
  if (issues) {
    return sendError(res, 400, "Invalid keywords payload", issues);
  }

  try {
    await getOrCreatePreferences(req.user.id);
    const updated = await Preference.findOneAndUpdate(
      { user: req.user.id },
      { $set: { keywords: value.keywords } },
      { new: true }
    );
    return sendSuccess(res, 200, "Keywords updated", updated);
  } catch (error) {
    return sendError(res, 503, "Database unavailable", error.message);
  }
});

router.delete("/", requireAuth, requireDatabase, async (req, res) => {
  try {
    const defaults = createDefaultPreferences();
    const reset = await Preference.findOneAndUpdate(
      { user: req.user.id },
      { $set: defaults },
      { upsert: true, new: true }
    );
    return sendSuccess(res, 200, "Preferences reset to defaults", reset);
  } catch (error) {
    return sendError(res, 503, "Database unavailable", error.message);
  }
});

module.exports = router;
