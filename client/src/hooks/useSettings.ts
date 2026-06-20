/**
 * useSettings Hook
 * Custom hook for managing application settings
 */

import { useEffect } from 'react';
import { useSettingsStore } from '../app/stores';
import { useTranslation } from 'react-i18next';

export const useSettings = () => {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { i18n } = useTranslation();

  // Apply language changes
  useEffect(() => {
    i18n.changeLanguage(settings.language);
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  }, [settings.language, i18n]);

  // Apply theme changes
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (settings.theme === 'dark') {
      htmlElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      htmlElement.classList.remove('dark');
    } else {
      // System mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const setLanguage = (language: 'ar' | 'en') => {
    updateSettings({ language });
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
  };

  const toggleNotifications = () => {
    updateSettings({ notifications: !settings.notifications });
  };

  const toggleOfflineMode = () => {
    updateSettings({ offlineMode: !settings.offlineMode });
  };

  return {
    settings,
    setLanguage,
    setTheme,
    toggleNotifications,
    toggleOfflineMode,
    resetSettings,
  };
};
