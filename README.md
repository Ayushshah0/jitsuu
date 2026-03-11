# Jitsuu

Jitsuu is a full-stack personalized news application built with React, Vite, Express, MongoDB, and NewsAPI. It combines live news browsing with authentication, bookmarks, smart notifications, rule-based article summarization, display personalization, and automatic API key rotation for more resilient NewsAPI access.

## Overview

The project is designed to feel more like a product than a basic news feed. Users can search global news, filter headlines by category or country, save articles, manage content preferences, receive smart alerts, customize the interface, and reset their password with OTP verification.

## Key Features

- Authentication with register, login, OAuth callback flow, and protected user actions
- Forgot password flow with OTP email verification and password reset
- Global news search with pagination
- Top headlines by category
- Country-specific news across multiple regions
- Bookmarks with persistent user storage
- Preference management for personalized news behavior
- Smart notifications based on interests and tracked searches
- Rule-based article summarization directly from article metadata/content
- Dark mode / day mode and adjustable font size controls
- Mobile-friendly responsive layout
- NewsAPI key rotation across multiple keys when quota or rate limits are hit

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Axios
- CSS with custom properties and responsive styling

### Backend
- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Nodemailer for OTP emails
- NewsAPI as the news data provider

## Architecture

Jitsuu uses a React frontend on port `2100` and an Express backend on port `5000`.

- The frontend talks to backend routes through the Vite `/api` proxy during development.
- The backend handles authentication, bookmarks, preferences, notifications, summarization, and NewsAPI proxying.
- MongoDB stores user accounts, preferences, bookmarks, and notification-related data.

## Main User Flows

### Reader Experience
- Browse all news
- Filter by category or country
- Search for specific topics
- Open original article source
- Generate a quick summary
- Save articles to bookmarks

### Account Experience
- Register and log in
- Reset password using OTP email verification
- Manage preferences
- Receive smart alerts
- Customize theme and font size

## API Key Rotation

The backend includes automatic NewsAPI key rotation.

- Supports `API_KEY`, `API_KEY_2`, and `API_KEY_3`
- Detects rate-limit and quota-style failures
- Automatically retries the same request with the next configured key
- Returns cached data when all keys are exhausted and a cached response exists
- Uses key-independent cache fingerprints so cached results remain reusable across rotated keys

This helps keep the service working without manual key switching during normal use.

## Environment Variables

Create a `.env` file inside the `server` directory.

```env
API_KEY=your_first_newsapi_key
API_KEY_2=your_second_newsapi_key
API_KEY_3=your_third_newsapi_key
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password
```

Notes:
- At least `API_KEY` is required for news requests.
- `API_KEY_2` and `API_KEY_3` are optional but recommended for rotation.
- `EMAIL_USER` and `EMAIL_PASS` are required for OTP password reset emails.

## Local Setup

### 1. Backend

```bash
cd server
npm install
npm start
```

Backend runs at:

```bash
http://localhost:5000
```

### 2. Frontend

In a new terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs at:

```bash
http://localhost:2100
```

## Important Routes

### Frontend Routes
- `/` - All news
- `/top-headlines` - Top headlines
- `/country/:iso` - Country news
- `/login` - Login page
- `/register` - Registration page
- `/forgot-password` - OTP password reset flow
- `/preferences` - User preferences
- `/bookmarks` - Saved articles
- `/oauth/callback` - OAuth callback handler

### Backend Routes
- `GET /` - Health check / API overview
- `GET /all-news` - Search all news
- `GET /top-headlines` - Fetch top headlines by category
- `GET /country/:iso` - Country news
- `POST /api/summarize` - Generate article summary
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Send OTP email
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/reset-password` - Reset password

## Project Structure

```text
jitsuu/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── .env
│   ├── package.json
│   └── server.js
└── README.md
```

## Challenges Solved

- Avoided client-side CORS issues using an Express proxy layer
- Added OTP-based password reset with email delivery
- Built resilient NewsAPI consumption with automatic API key rotation
- Improved mobile responsiveness for header actions and settings panel
- Added rule-based summaries without requiring a paid LLM dependency

## Portfolio Highlights

This project demonstrates:

- Full-stack React + Express integration
- REST API design
- Authentication and protected user flows
- MongoDB schema and persistence patterns
- API reliability improvements through key rotation and caching
- Responsive UI customization and user preference management

## Future Improvements

- Article detail page with related stories
- Text-to-speech summaries
- Reading history
- Personalized feed ranking
- Shareable summary cards

## Author

Built as a full-stack portfolio project around personalized news discovery and resilient API integration.
