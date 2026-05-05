# Dialogflow NLP Chatbot Setup Guide

This guide walks you through setting up the Google Cloud Dialogflow agent for the News Aggregator chatbot with NLP intent recognition and webhook integration.

## Prerequisites

- Google Cloud account with billing enabled
- `gcloud` CLI installed (`https://cloud.google.com/sdk/docs/install`)
- News Aggregator backend running at `http://localhost:3001` (or deployed URL)
- Node.js environment with the chatbot backend services configured

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **NEW PROJECT**
4. Enter project name: `news-aggregator-chatbot`
5. Click **CREATE**
6. Wait for the project to be created and select it

## Step 2: Enable Dialogflow API

1. In the Google Cloud Console, go to **APIs & Services > Library**
2. Search for `Dialogflow API`
3. Click on the result and press **ENABLE**
4. Also enable:
   - **Cloud Logging API**
   - **Cloud Trace API**
   - **Language API** (optional, for advanced NLP)

## Step 3: Create a Service Account

1. Go to **APIs & Services > Credentials**
2. Click **CREATE CREDENTIALS > Service Account**
3. Fill in:
   - **Service account name**: `dialogflow-chatbot`
   - **Service account ID**: auto-filled
4. Click **CREATE AND CONTINUE**
5. Grant roles:
   - Add role: **Dialogflow API Admin**
6. Click **CONTINUE** then **DONE**
7. Click the service account name to open details
8. Go to **KEYS** tab
9. Click **ADD KEY > Create new key > JSON**
10. Save the JSON file securely (you'll need this for authentication)

## Step 4: Create a Dialogflow Agent

### Using Google Cloud Console (Recommended)

1. Go to [Dialogflow Console](https://dialogflow.cloud.google.com/)
2. Click on your Google Cloud project in the top dropdown
3. Click **CREATE AGENT**
4. Fill in:
   - **Agent name**: `news-aggregator-bot`
   - **Language**: English (en)
   - **Time zone**: Your timezone
   - **Google Cloud project**: Select your created project
5. Click **CREATE**

### Using gcloud CLI (Alternative)

```bash
gcloud dialogflow agents create \
  --display-name="news-aggregator-bot" \
  --default-language-code=en \
  --default-time-zone="America/New_York"
```

## Step 5: Create Intents

Import the pre-built intents from `server/docs/dialogflow-intents.json` or create them manually:

### Intent 1: Get Top Headlines

**Display name**: `GetTopHeadlines`  
**Training phrases**:
- What are the top news headlines?
- Show me trending news
- Get the top stories
- What's trending today?

**Action and parameters**: 
- Action: `get_top_headlines`
- Parameter: `country` (optional, entity: @sys.geo-city)

**Fulfillment**: Enable webhook call for this intent

---

### Intent 2: Summarize News

**Display name**: `SummarizeNews`  
**Training phrases**:
- Summarize this news article
- Give me a summary of the latest news
- What's the summary?
- Can you summarize?

**Action and parameters**:
- Action: `summarize_news`
- Parameter: `topic` (required, entity: @sys.any)

**Fulfillment**: Enable webhook call for this intent

---

### Intent 3: Explain News

**Display name**: `ExplainNews`  
**Training phrases**:
- Explain this news
- Break down the news
- Help me understand this
- What does this mean?

**Action and parameters**:
- Action: `explain_news`
- Parameter: `topic` (required, entity: @sys.any)

**Fulfillment**: Enable webhook call for this intent

---

### Intent 4: Recommend News

**Display name**: `RecommendNews`  
**Training phrases**:
- What should I read next?
- Recommend some news
- Suggest articles for me
- What's good to read?

**Action and parameters**:
- Action: `recommend_news`
- Parameter: `interests` (optional, entity: @sys.any)

**Fulfillment**: Enable webhook call for this intent

---

### Intent 5: Set User Preferences

**Display name**: `SetPreferences`  
**Training phrases**:
- I'm interested in tech
- Set my interests to sports
- I like politics
- Update my preferences

**Action and parameters**:
- Action: `set_preferences`
- Parameter: `category` (required, entity: @sys.any)

**Fulfillment**: Enable webhook call for this intent

---

### Default Fallback Intent

**Display name**: `Default Fallback Intent`  
**Response**: 
```
I'm not sure about that. I can help you with:
- Top headlines
- News summaries
- News recommendations
- Setting your preferences
```

**Fulfillment**: Enable webhook call (optional)

## Step 6: Set Up Webhooks

Webhooks connect Dialogflow intents to your backend server for dynamic responses.

### Configure Webhook URL

1. In Dialogflow Console, go to **Fulfillment** (left sidebar)
2. Enable the **Webhook** toggle
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/chatbot
   ```
   Or for local testing with ngrok:
   ```
   https://your-ngrok-url.ngrok.io/api/chatbot
   ```

4. (Optional) Add a timeout: `5` seconds
5. (Optional) Add custom headers if needed
6. Click **SAVE**

### Use ngrok for Local Testing

1. Install ngrok: `https://ngrok.com/download`
2. Run: `ngrok http 3001`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Use this URL as your webhook in Dialogflow
5. Your webhook endpoint: `https://abc123.ngrok.io/chatbot`

## Step 7: Enable Dialogflow in Backend

### Set Environment Variables

```bash
# .env
GOOGLE_DIALOGFLOW_PROJECT_ID=your-project-id
GOOGLE_DIALOGFLOW_SERVICE_ACCOUNT_JSON=/path/to/service-account-key.json
```

### Verify Chatbot Routes

Check that your backend has these routes:

```javascript
// server/routes/chatbot.js
POST /chatbot
- Receives webhook request from Dialogflow
- Processes intent and parameters
- Calls appropriate service (newsService, recommendationEngine, etc.)
- Returns response to Dialogflow
```

## Step 8: Test the Integration

### Using Dialogflow Console

1. Click the **Agents** button in the top right
2. Click **Test Agent**
3. Type a test message:
   ```
   What are the top headlines?
   ```
4. Watch the webhook logs in your backend

### Using curl

```bash
# Test your webhook directly
curl -X POST http://localhost:3001/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "queryInput": {
      "text": "What are the top headlines?",
      "languageCode": "en"
    },
    "session": "projects/news-aggregator-chatbot/agent/sessions/12345"
  }'
```

### Using the Frontend Chatbot

1. Start the client: `npm run dev` in `client/`
2. Click the chatbot button (bottom-right corner)
3. Type a message
4. The message goes to your backend `/chatbot` route
5. Backend forwards to Dialogflow for intent recognition
6. Dialogflow triggers webhook, returns to backend
7. Backend sends response back to frontend

## Step 9: Deploy to Production

### Deploy Backend

1. Push code to GitHub/GitLab
2. Deploy using Vercel, Heroku, or AWS:
   ```bash
   # Example: Vercel
   vercel deploy
   ```
3. Set environment variables on the platform
4. Get your production URL (e.g., `https://news-agg-api.vercel.app`)

### Update Dialogflow Webhook URL

1. In Dialogflow Console, go to **Fulfillment**
2. Update webhook URL to your production URL:
   ```
   https://news-agg-api.vercel.app/chatbot
   ```

### Enable Dialogflow API on Production

Ensure the service account has access to the Dialogflow API on the production environment.

## Troubleshooting

### Issue: Webhook not being called

**Solution**:
- Check that webhook is enabled on intent
- Verify webhook URL is correct
- Ensure backend is running and accessible
- Check server logs for errors
- Verify network connectivity

### Issue: Authentication errors

**Solution**:
- Verify service account JSON is correct
- Check that Dialogflow API is enabled
- Ensure project ID matches in `.env`

### Issue: Intent not being recognized

**Solution**:
- Add more training phrases to the intent
- Review the exact user input that's failing
- Use Dialogflow's **Diagnostics** feature to see matched intent
- Train the agent with more examples

### Issue: Slow responses

**Solution**:
- Check webhook timeout setting (increase to 10-30 seconds)
- Optimize backend services (cache, database queries)
- Use async/await properly in webhook handler

## Next Steps

1. **Live Agent Integration**: Transition to Dialogflow's live agent system for complex queries
2. **Analytics**: Enable Dialogflow Analytics to track user conversations
3. **Custom Entities**: Create domain-specific entities (news topics, publications, authors)
4. **Context Management**: Use Dialogflow context for multi-turn conversations
5. **ML Training**: Use Dialogflow's machine learning to improve intent recognition over time

## Resources

- [Dialogflow Documentation](https://cloud.google.com/dialogflow/docs)
- [Dialogflow CX Documentation](https://cloud.google.com/dialogflow/cx/docs) (recommended for new projects)
- [Webhook Fulfillment](https://cloud.google.com/dialogflow/docs/fulfillment-webhook-overview)
- [Intent Training](https://cloud.google.com/dialogflow/docs/intents-training-phrases)
- [Service Account Setup](https://cloud.google.com/iam/docs/creating-managing-service-accounts)

## Support

For issues or questions:
1. Check the [Dialogflow Issues page](https://issuetracker.google.com/issues?q=componentid:505135)
2. Visit [Stack Overflow](https://stackoverflow.com/questions/tagged/google-dialogflow)
3. Review backend server logs at `server/index.js` and `server/routes/chatbot.js`
