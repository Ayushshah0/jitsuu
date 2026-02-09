# Getting Started

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn

## Installation

### Server Setup
```bash
cd server
npm install
```

Create a `.env` file in the server directory:
```
NEWS_API_KEY=your_newsapi_key_here
PORT=5000
```

Start the server:
```bash
npm start
# or
node server.js
```

### Client Setup
```bash
cd client
npm install
npm start
```

The React app will open at `http://localhost:3000`

## Project Structure
```
jitsuu/
├── server/
│   ├── server.js          # Express backend
│   ├── package.json
│   └── .env
└── client/
    ├── src/
    │   ├── services/
    │   │   └── newsService.js    # Axios API service
    │   ├── components/
    │   │   └── NewsArticles.js   # News display component
    │   ├── App.js               # Main component
    │   └── index.js
    ├── public/
    │   └── index.html
    └── package.json
```

## Features
- **Axios Integration**: Fully configured axios service with interceptors
- **Error Handling**: Comprehensive error handling in the API service
- **Category Filtering**: Filter news by different categories
- **Responsive Design**: Mobile-friendly UI with CSS Grid
- **Loading States**: User-friendly loading and error messages

## API Endpoints (Backend)
- `GET /api/news` - Get all news articles
- `GET /api/news/category/:category` - Get news by category
- `GET /api/news/search?q=query` - Search news articles
- `GET /api/news/country/:country` - Get news by country
