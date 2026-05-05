import "./App.css";
import Header from "./components/Header";
import AllNews from "./components/AllNews";
import TopHeadlines from "./components/TopHeadlines";
import UniversalSearchResults from "./components/UniversalSearchResults";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CountryNews from "./components/CountryNews";
import Login from "./components/Login";
import Preferences from "./components/Preferences";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import OAuthCallback from "./components/OAuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="w-full">
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<AllNews />} />
          <Route path="/top-headlines/:category" element={<TopHeadlines />} />
          <Route path="/country/:iso" element={<CountryNews />} />
          <Route path="/search" element={<UniversalSearchResults />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
