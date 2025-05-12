
import { SortMode, TopTimeFilter, ViewMode } from '@/types';

export interface UserSettings {
  targetSubreddit: string;
  sourceSubreddits: string;
  viewMode: ViewMode;
  sortMode: SortMode;
  topTimeFilter: TopTimeFilter;
}

const SETTINGS_KEY = 'gaslighter_user_settings';

export const defaultSettings: UserSettings = {
  targetSubreddit: '',
  sourceSubreddits: 'pics',
  viewMode: 'list',
  sortMode: 'hot',
  topTimeFilter: 'day',
};

export const saveSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
};

export const loadSettings = (): UserSettings => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      return { ...defaultSettings, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }
  return { ...defaultSettings };
};
