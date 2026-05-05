# Article Summarize Test Cases

## Backend

1. Valid summarize request
- Request: `POST /summarize` with article title/description/content/url/source/publishedAt
- Expect: `200`, `success=true`, and `data` object with:
  - `summary`
  - `keyPoints` (array, max 3)
  - `whyItMatters`
  - `method`
  - `meta`

2. Empty article request
- Request: `POST /summarize` with `article: {}` or all text fields empty
- Expect: `400`, `success=false`, error message indicating title/description/content required

3. Cache hit behavior
- Send the same article payload twice (same `url`)
- Expect second response message: `Summary loaded from cache.`

## Frontend

1. Loading state
- Click `Summarize` button on any article card
- Expect button label to become `Summarizing...` while request is in progress

2. Success state and panel rendering
- After success, summary panel expands and renders:
  - summary text
  - key points list
  - why it matters line
  - metadata note with source/date/limited-content note if present

3. Toggle without refetch
- Click `Hide Summary` to collapse
- Click `Summarize` again
- Expect panel opens instantly without another network call for same card state

4. Error state
- Simulate backend failure (stop server or force 500)
- Click `Summarize`
- Expect friendly inline error message on the card

5. Existing behavior check
- Ensure source/read link remains unchanged and still opens article URL
