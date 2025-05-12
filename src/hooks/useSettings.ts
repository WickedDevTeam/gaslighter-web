
import { useState, useEffect, useCallback } from 'react';
import { UserSettings, loadSettings, saveSettings, defaultSettings } from '@/utils/settingsStore';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on initial mount
  useEffect(() => {
    const storedSettings = loadSettings();
    setSettings(storedSettings);
    setIsLoaded(true);
  }, []);

  // Save settings whenever they change
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      saveSettings(updatedSettings);
      return updatedSettings;
    });
  }, []);

  return { settings, updateSettings, isLoaded };
}
