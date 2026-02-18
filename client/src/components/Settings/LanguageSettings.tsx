import React from 'react';
import { Box, Select, MenuItem } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store';
import { setLanguage } from '@store/slices/uiSlice';

export default function LanguageSettings() {
  const dispatch = useDispatch();
  const lang = useSelector((state: RootState) => state.ui.language);
  const handleChange = (e: any) => {
    dispatch(setLanguage(e.target.value));
  };
  return (
    <Box>
      <h2>Мова</h2>
      <Select value={lang} onChange={handleChange}>
        <MenuItem value="uk">Українська</MenuItem>
        <MenuItem value="en">English</MenuItem>
      </Select>
    </Box>
  );
}
