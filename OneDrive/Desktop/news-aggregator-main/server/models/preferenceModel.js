const { z } = require("zod");

const AVAILABLE_CATEGORIES = [
  "general",
  "business",
  "entertainment",
  "health",
  "science",
  "sports",
  "technology",
  "politics",
];

const AVAILABLE_LANGUAGES = ["en", "de", "fr", "es", "it", "pt", "hi", "ja"];

const AVAILABLE_COUNTRIES = ["us", "gb", "de", "fr", "it", "in", "jp", "br", "ca", "np", "cn"];

const AVAILABLE_KEYWORDS = [
  "election",
  "ai",
  "finance",
  "climate",
  "sports",
  "technology",
  "startup",
  "healthcare",
  "crypto",
  "education",
];

const frequencySchema = z.enum(["instant", "daily", "weekly"]);

const channelSchema = z
  .object({
    enabled: z.boolean(),
    frequency: frequencySchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.enabled && value.frequency !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "frequency must be omitted when notifications are disabled",
      });
    }

    if (value.enabled && !value.frequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "frequency is required when notifications are enabled",
      });
    }
  });

const notificationsSchema = z.object({
  inApp: channelSchema,
  email: channelSchema,
  push: channelSchema,
  browser: channelSchema,
});

const preferenceSchema = z.object({
  categories: z.array(z.enum(AVAILABLE_CATEGORIES)).min(1).max(5),
  country: z.enum(AVAILABLE_COUNTRIES),
  language: z.enum(AVAILABLE_LANGUAGES),
  theme: z.enum(["light", "dark", "auto"]),
  keywords: z.array(z.string().trim().min(2).max(30)).max(20),
  notifications: notificationsSchema,
});

const themePatchSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]),
});

const notificationsPatchSchema = z.object({
  notifications: notificationsSchema,
});

const keywordsPatchSchema = z.object({
  keywords: z.array(z.string().trim().min(2).max(30)).max(20),
});

function createDefaultPreferences() {
  return {
    categories: ["general", "technology"],
    country: "us",
    language: "en",
    theme: "auto",
    keywords: ["ai", "technology"],
    notifications: {
      inApp: { enabled: true, frequency: "instant" },
      email: { enabled: false },
      push: { enabled: false },
      browser: { enabled: false },
    },
  };
}

module.exports = {
  AVAILABLE_CATEGORIES,
  AVAILABLE_COUNTRIES,
  AVAILABLE_LANGUAGES,
  AVAILABLE_KEYWORDS,
  preferenceSchema,
  themePatchSchema,
  notificationsPatchSchema,
  keywordsPatchSchema,
  createDefaultPreferences,
};
