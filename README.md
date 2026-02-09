# Jitsuu - News Application

A modern news aggregator built with React (Vite), Express, and NewsAPI.

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn

## Installation

### 1. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```
API_KEY=your_newsapi_key_here
PORT=3000
```
Get your free API key from [NewsAPI.org](https://newsapi.org)

Start the server:
```bash
npm run dev
# or
node server.js
```
Server runs at `http://localhost:3000`

### 2. Frontend Setup
In a **new terminal**, from the project root:
```bash
cd client
npm install
npm run dev
```
App opens at `http://localhost:2100`

## Project Structure
```
jitsuu/
├── server/
│   ├── server.js          # Express backend with NewsAPI proxy
│   ├── package.json
│   └── .env               # API credentials (not tracked)
└── client/
    ├── src/
    │   ├── services/
    │   │   └── newsService.js       # Axios API service
    │   ├── components/
    │   │   ├── Header.jsx           # Navigation + search
    │   │   ├── News.jsx             # All news with pagination
    │   │   ├── TopHeadlines.jsx     # Top headlines by category
    │   │   ├── CountryNews.jsx      # News by country
    │   │   ├── ErrorMessage.jsx     # Error UI
    │   │   └── SkeletonCard.jsx     # Loading placeholder
    │   ├── App.jsx                  # Router setup
    │   └── main.jsx
    ├── vite.config.js               # Vite config + API proxy
    └── package.json
```

## Features
- ✅ **Global Search**: Search news by keyword (on home page)
- ✅ **Category Filtering**: Filter top headlines by 7+ categories
- ✅ **Country-Specific News**: Browse news from 9 countries
- ✅ **Responsive Design**: 1 column (mobile) → 2 (tablet) → 3 (desktop)
- ✅ **Skeleton Loaders**: Animated loading cards for better UX
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Pagination**: Navigate through articles
- ✅ **Backend Proxy**: NewsAPI calls via Express (avoids CORS)

## API Endpoints (Backend)
- `GET /` - Server health check
- `GET /all-news?q=keyword&pageSize=40&page=1` - Search all news
- `GET /top-headlines?category=business&pageSize=40&page=1` - Top headlines by category
- `GET /country/:iso?pageSize=40&page=1` - News by country ISO code (e.g., `us`, `in`, `gb`)
