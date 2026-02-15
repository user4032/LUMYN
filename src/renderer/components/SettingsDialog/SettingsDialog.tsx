import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store';
import { setTheme, setLanguage } from '@store/slices/uiSlice';
import { updateStatus, logout } from '@store/slices/userSlice';
import { t } from '@i18n/index';
import { logoutAccount } from '@/renderer/api/auth';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import type { Language } from '@i18n/translations';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const theme = useSelector((state: RootState) => state.ui.theme);
  const language = useSelector((state: RootState) => state.ui.language);
  
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [appVersion, setAppVersion] = React.useState('0.1.5');
  
  const [compactMode, setCompactMode] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [desktopNotifications, setDesktopNotifications] = React.useState(true);
  const [animations, setAnimations] = React.useState(true);
  const [isDarkTheme, setIsDarkTheme] = React.useState(theme === 'dark');
  const [timeFormat, setTimeFormat] = React.useState<'12' | '24'>('24');
  const [showSeconds, setShowSeconds] = React.useState(false);
  const [chatTextScale, setChatTextScale] = React.useState(1);

  const applyChatTextScale = (scale: number) => {
    document.documentElement.style.setProperty('--chat-text-scale', String(scale));
  };

  // Завантаження налаштувань при відкритті
  React.useEffect(() => {
    if (open) {
      setIsDarkTheme(theme === 'dark');
      
      // Отримуємо версію додатку
      if (window.electronAPI && window.electronAPI.getAppVersion) {
        window.electronAPI.getAppVersion().then((version: string) => {
          setAppVersion(version);
        });
      }
      
      // Завантажуємо налаштування з localStorage
      try {
        const settings = JSON.parse(localStorage.getItem('disgram_settings') || '{}');
        setCompactMode(settings.compactMode || false);
        setSoundEnabled(settings.soundEnabled !== false);
        setDesktopNotifications(settings.desktopNotifications !== false);
        setAnimations(settings.animations !== false);
        setTimeFormat(settings.timeFormat || '24');
        setShowSeconds(settings.showSeconds || false);
        if (settings.language) {
          dispatch(setLanguage(settings.language as Language));
        }
        const nextScale = Number(settings.chatTextScale) || 1;
        setChatTextScale(nextScale);
        applyChatTextScale(nextScale);
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, [open, currentUser, dispatch]);

  const handleSave = () => {
    // Зберігаємо налаштування
    const settings = {
      theme: isDarkTheme ? 'dark' : 'light',
      compactMode,
      soundEnabled,
      desktopNotifications,
      animations,
      timeFormat,
      showSeconds,
      language,
      chatTextScale,
    };
    localStorage.setItem('disgram_settings', JSON.stringify(settings));
    
    // Застосовуємо анімації
    document.body.style.setProperty('--animations-enabled', animations ? '1' : '0');
    if (!animations) {
      document.body.style.setProperty('transition', 'none');
    } else {
      document.body.style.setProperty('transition', '');
    }
    
    onClose();
  };

  const handleResetSettings = () => {
    setConfirmReset(true);
  };

  const confirmResetSettings = () => {
    // Видалити всі налаштування з localStorage
    localStorage.removeItem('disgram_settings');
    localStorage.removeItem('disgram_logo');
    localStorage.removeItem('disgram_user');
    
    // Скидаємо стани
    setCompactMode(false);
    setSoundEnabled(true);
    setDesktopNotifications(true);
    setAnimations(true);
    setTimeFormat('24');
    setShowSeconds(false);
    setChatTextScale(1);
    
    setConfirmReset(false);
    alert(t('settingsReset', language));
  };

  const handleLogout = () => {
    setConfirmLogout(true);
  };

  const confirmLogoutAction = async () => {
    try {
      const token = localStorage.getItem('disgram_auth_token');
      if (token) {
        await logoutAccount(token);
      }
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Очищуємо всі дані користувача
      localStorage.removeItem('disgram_auth_token');
      localStorage.removeItem('disgram_user');
      localStorage.removeItem('disgram_settings');
      localStorage.removeItem('disgram_logo');
      // Не видаляємо disgram_messages та disgram_chats - вони зберігаються локально для користувача

      // Розлогінюємося в Redux
      dispatch(logout());

      setConfirmLogout(false);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 6,
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>
        {t('settings', language)}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        {/* Налаштування інтерфейсу */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('interface', language)}
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={isDarkTheme}
                onChange={(e) => {
                  setIsDarkTheme(e.target.checked);
                  dispatch(setTheme(e.target.checked ? 'dark' : 'light'));
                }}
              />
            }
            label={t('darkTheme', language)}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
              />
            }
            label={t('compactMode', language)}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={animations}
                onChange={(e) => setAnimations(e.target.checked)}
              />
            }
            label={t('animations', language)}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('chatTextScale', language)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('chatTextScaleHint', language)}
            </Typography>
            <Box sx={{ mt: 1.5, px: 1 }}>
              <Slider
                value={chatTextScale}
                min={0.75}
                max={1.5}
                step={null}
                marks={[
                  { value: 0.75, label: '12px' },
                  { value: 0.875, label: '14px' },
                  { value: 0.9375, label: '15px' },
                  { value: 1, label: '16px' },
                  { value: 1.125, label: '18px' },
                  { value: 1.25, label: '20px' },
                  { value: 1.5, label: '24px' },
                ]}
                onChange={(_, value) => {
                  const nextScale = value as number;
                  setChatTextScale(nextScale);
                  applyChatTextScale(nextScale);
                  try {
                    const settings = JSON.parse(localStorage.getItem('disgram_settings') || '{}');
                    localStorage.setItem('disgram_settings', JSON.stringify({
                      ...settings,
                      chatTextScale: nextScale,
                    }));
                    window.dispatchEvent(new Event('disgram-settings'));
                  } catch (e) {
                    console.error('Failed to save chat text scale:', e);
                  }
                }}
                sx={(theme) => ({
                  '& .MuiSlider-rail': {
                    opacity: 0.4,
                    height: 4,
                  },
                  '& .MuiSlider-track': {
                    height: 4,
                  },
                  '& .MuiSlider-thumb': {
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.background.paper,
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    transition: 'transform 0.2s ease, border-radius 0.2s ease, background-color 0.2s ease',
                  },
                  '& .MuiSlider-thumb.Mui-active': {
                    borderRadius: '30%',
                    backgroundColor: theme.palette.primary.main,
                    transform: 'rotate(45deg) scale(1.2)',
                  },
                  '& .MuiSlider-mark': {
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                  },
                  '& .MuiSlider-markLabel': {
                    fontSize: '0.7rem',
                    color: theme.palette.text.secondary,
                    mt: 1,
                  },
                })}
              />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Налаштування часу та мови */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('time-language', language)}
          </Typography>
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>{t('timeFormat', language)}</InputLabel>
            <Select
              value={timeFormat}
              label={t('timeFormat', language)}
              onChange={(e) => setTimeFormat(e.target.value as '12' | '24')}
            >
              <MenuItem value="24">{t('timeFormat24', language)}</MenuItem>
              <MenuItem value="12">{t('timeFormat12', language)}</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch 
                checked={showSeconds}
                onChange={(e) => setShowSeconds(e.target.checked)}
              />
            }
            label={t('showSeconds', language)}
          />

          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>{t('language', language)}</InputLabel>
            <Select
              value={language}
              label={t('language', language)}
              onChange={(e) => dispatch(setLanguage(e.target.value as Language))}
            >
              <MenuItem value="uk">{t('ukrainian', language)}</MenuItem>
              <MenuItem value="en">{t('english', language)}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Налаштування сповіщень */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('notifications', language)}
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
            }
            label={t('soundNotif', language)}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={desktopNotifications}
                onChange={(e) => setDesktopNotifications(e.target.checked)}
              />
            }
            label={t('desktopNotif', language)}
          />
          
          <FormControlLabel
            control={<Switch />}
            label={t('messagePreview', language)}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Про додаток */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('about', language)}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            LUMYN v{appVersion}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {language === 'en' ? 'Next-gen messenger' : 'Месенджер нового покоління'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleResetSettings} variant="outlined" color="warning">
            {t('resetSettings', language)}
          </Button>
          <Button onClick={handleLogout} variant="outlined" color="error">
            {t('logout', language)}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} variant="outlined">
            {t('cancel', language)}
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {t('save', language)}
          </Button>
        </Box>
      </DialogActions>
      
      {/* Діалог підтвердження скидання налаштувань */}
      <ConfirmDialog
        open={confirmReset}
        title={t('resetSettings', language)}
        message={t('resetSettingsConfirm', language)}
        confirmText={t('reset', language)}
        cancelText={t('cancel', language)}
        onConfirm={confirmResetSettings}
        onCancel={() => setConfirmReset(false)}
        confirmColor="warning"
      />

      {/* Діалог підтвердження виходу */}
      <ConfirmDialog
        open={confirmLogout}
        title={t('logout', language)}
        message={t('logoutConfirm', language)}
        confirmText={t('logout', language)}
        cancelText={t('cancel', language)}
        onConfirm={confirmLogoutAction}
        onCancel={() => setConfirmLogout(false)}
        confirmColor="error"
      />
    </Dialog>
  );
};

export default SettingsDialog;
