import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { newsService } from '../services/newsService';
import AuthContext from './AuthContext';

const NotificationContext = createContext();
const POLL_INTERVAL_MS = 2 * 60 * 1000;

export function NotificationProvider({ children }) {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(null);
  const [trackedKeywords, setTrackedKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const shownBrowserIdsRef = useRef(new Set());

  const browserEnabled = Boolean(settings?.browser?.enabled);
  const inAppEnabled = settings?.inApp?.enabled !== false;

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const showBrowserNotifications = (items) => {
    if (!browserEnabled || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (window.Notification.permission !== 'granted') {
      return;
    }

    items.forEach((item) => {
      if (!item?._id || shownBrowserIdsRef.current.has(item._id)) {
        return;
      }

      shownBrowserIdsRef.current.add(item._id);
      const notification = new window.Notification(item.title, {
        body: item.summary || `New story from ${item.sourceName || 'your tracked topics'}`,
        icon: item.imageUrl || undefined,
        tag: item._id
      });

      notification.onclick = () => {
        if (item.articleUrl) {
          window.open(item.articleUrl, '_blank', 'noopener,noreferrer');
        }
        notification.close();
      };
    });
  };

  const refreshNotifications = async ({ silent = false } = {}) => {
    if (!user) {
      setNotifications([]);
      setSettings(null);
      setTrackedKeywords([]);
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await newsService.checkNotifications();
      const payload = response.data.data || {};
      const nextNotifications = payload.notifications || [];
      const newNotifications = payload.newNotifications || [];

      setNotifications(nextNotifications);
      setSettings(payload.settings || null);
      setTrackedKeywords(payload.trackedKeywords || []);
      showBrowserNotifications(newNotifications);
    } catch (error) {
      console.error('Notification refresh failed:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setNotifications([]);
      setSettings(null);
      setTrackedKeywords([]);
      return;
    }

    refreshNotifications();

    const intervalId = window.setInterval(() => {
      refreshNotifications({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user, authLoading]);

  const requestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    return window.Notification.requestPermission();
  };

  const trackSearchTerm = async (term) => {
    if (!user || !term?.trim()) {
      return;
    }

    try {
      const response = await newsService.trackSearchKeyword(term);
      const payload = response.data.data || {};
      setTrackedKeywords(payload.trackedKeywords || []);
    } catch (error) {
      console.error('Track search term failed:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await newsService.markNotificationRead(notificationId);
      const updatedNotification = response.data.data;
      setNotifications((current) =>
        current.map((notification) =>
          notification._id === updatedNotification._id ? updatedNotification : notification
        )
      );
    } catch (error) {
      console.error('Mark notification read failed:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await newsService.markAllNotificationsRead();
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Mark all notifications read failed:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        settings,
        browserEnabled,
        inAppEnabled,
        trackedKeywords,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        requestBrowserPermission,
        trackSearchTerm,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationContext;