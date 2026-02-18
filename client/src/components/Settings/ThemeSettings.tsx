import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Slider, Typography } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store';
import { setTheme } from '@store/slices/uiSlice';
function ThemeSettings() {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const [textScale, setTextScale] = React.useState(() => {
    const saved = localStorage.getItem('disgram_text_scale');
    return saved ? Number(saved) : 1;
  });
  // Тільки темна тема
  const handleChange = (_: any, value: 'dark' | null) => {
    if (value) dispatch(setTheme(value));
  };
  const handleTextScale = (_: any, value: number | number[]) => {
    const scale = Array.isArray(value) ? value[0] : value;
    setTextScale(scale);
    localStorage.setItem('disgram_text_scale', String(scale));
    document.documentElement.style.setProperty('--chat-text-scale', String(scale));
  };
  React.useEffect(() => {
    if (theme !== 'dark') dispatch(setTheme('dark'));
    // eslint-disable-next-line
  }, []);
  return (
    <Box>
      <h2>Тема</h2>
      <ToggleButtonGroup value={theme} exclusive onChange={handleChange} sx={{ mb: 3 }}>
        <ToggleButton value="dark">Темна</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ mt: 2 }}>
        <Typography gutterBottom>Розмір тексту повідомлень</Typography>
        <Slider
          min={0.8}
          max={1.5}
          step={0.05}
          value={textScale}
          onChange={handleTextScale}
          valueLabelDisplay="auto"
        />
      </Box>
    </Box>
  );
}

export default ThemeSettings;
