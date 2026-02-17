import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Language } from '@i18n/translations';
import { setLanguage as setI18nLanguage } from '@i18n/index';

interface UIState {
  theme: 'light' | 'dark';
  language: Language;
  sidebarCollapsed: boolean;
  isSettingsOpen: boolean;
  searchQuery: string;
}

const initialState: UIState = {
  theme: 'dark',
  language: 'uk',
  sidebarCollapsed: false,
  isSettingsOpen: false,
  searchQuery: '',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      // Синхронізуємо з i18n модулем
      setI18nLanguage(action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSettingsOpen: (state, action: PayloadAction<boolean>) => {
      state.isSettingsOpen = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { toggleTheme, setTheme, setLanguage, toggleSidebar, setSettingsOpen, setSearchQuery } = uiSlice.actions;
export default uiSlice.reducer;
