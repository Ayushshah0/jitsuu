import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import News from './components/News';
import TopHeadlines from './components/TopHeadlines';
import CountryNews from './components/CountryNews';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PreferencesPage from './pages/PreferencesPage';
import BookmarksPage from './pages/BookmarksPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="root">
        <Header />
        <Routes>
          <Route path="/" element={<News />} />
          <Route path="/top-headlines" element={<TopHeadlines />} />
          <Route path="/country/:iso" element={<CountryNews />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
