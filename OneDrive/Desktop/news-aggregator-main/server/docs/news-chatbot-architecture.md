# AI News Chatbot Architecture

## System Architecture

```text
Web (React) / Mobile (Flutter)
        |
        v
In-app Chat UI (text + optional voice)
        |
        v
Google Dialogflow (intent detection + session context)
        |
        v
Node.js API Gateway / Webhook
        |
        +--> News API layer (NewsAPI / GNews)
        +--> Summarization module (LLM-ready interface, rule-based fallback)
        +--> Recommendation engine (rule-based MVP)
        +--> User Profile store (MongoDB)
        +--> Cache layer (Redis recommended, in-memory fallback)
        +--> Analytics / Logging (Google Cloud Logging)
```

## Dialogflow Intent Structure

### GetTopHeadlines
- Training phrases: latest headlines, what's new in tech, top stories in India, news about AI
- Parameters: topic, category, location
- Webhook: `POST /chatbot/webhook`

### SummarizeNews
- Training phrases: summarize this story, give me a quick summary, bullet points please
- Parameters: topic, article_url, category, location
- Webhook: `POST /chatbot/webhook`

### ExplainNews
- Training phrases: explain this like I'm five, what happened here, give me background
- Parameters: topic, category, location, session_id
- Webhook: `POST /chatbot/webhook`

### RecommendNews
- Training phrases: recommend news for me, what should I read next, personalize news
- Parameters: topic, category, source, location
- Webhook: `POST /chatbot/webhook`

### SetPreferences
- Training phrases: set my interests, update my preferences, follow AI and sports
- Parameters: topics, sources, categories, language, country
- Webhook: `POST /chatbot/webhook`

### FallbackIntent
- Training phrases: unmatched utterances
- Behavior: ask clarifying question and suggest supported commands

## Backend API Design

- `POST /chatbot/webhook` - Dialogflow fulfillment endpoint
- `POST /chatbot/summarize` - Summarize news by topic/article
- `POST /chatbot/explain` - Explain a story with context retention
- `POST /chatbot/recommend` - Recommend articles from history + preferences
- `POST /chatbot/preferences` - Update user preferences
- `GET /chatbot/top-headlines` - Fetch latest headlines

## Data Model

### User Profile
- `user_id`
- `preferences`: topics, sources, categories, language, country, consent flags
- `reading_history`: article URLs, timestamps, topics
- `saved_articles`: bookmarked article ids / URLs

### Session Context
- `session_id`
- `current_topic`
- `previous_queries`
- `last_intent`

## Security & Privacy

- Auth: OAuth 2.0 / JWT
- Transport: HTTPS
- Storage: encrypted at rest with AES-256 (managed by cloud provider)
- RBAC on profile/preferences endpoints
- Opt-in personalization consent
- Compliance: GDPR, CCPA

## Deployment Approach

- Frontend web: Cloud Run, Firebase Hosting, or GKE ingress
- Mobile: Flutter app consuming the same API gateway
- Backend: Cloud Run / GKE with autoscaling
- Database: MongoDB Atlas or MongoDB on GCP
- Cache: Redis (Memorystore)
- Logging: Google Cloud Logging + Error Reporting
- Secret management: Secret Manager

## MVP Roadmap

### Phase 1
- Headline summarization
- Basic explain feature
- Topic-based personalization
- Dialogflow integration

### Phase 2
- Multi-turn memory
- Advanced recommendations
- Voice support

### Phase 3
- ML-based personalization
- Trending insights
- User behavior analytics