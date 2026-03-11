import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { ThemeProvider } from './context/ThemeContext';

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <AuthProvider>
      <NotificationProvider>
        <BookmarkProvider>
          <App />
        </BookmarkProvider>
      </NotificationProvider>
    </AuthProvider>
  </ThemeProvider>,
)
