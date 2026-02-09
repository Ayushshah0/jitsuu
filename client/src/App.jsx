import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import News from './components/News';
import TopHeadlines from './components/TopHeadlines';
import CountryNews from './components/CountryNews';
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
