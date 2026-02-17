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
import { styled } from '@mui/material/styles';
import { keyframes } from '@mui/system';
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

const dialogPop = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const dialogFade = keyframes`
  0% {
    opacity: 0;
    transform: translateY(6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const sheenShift = keyframes`
  0% {
    transform: translateX(-120%);
  }
  50% {
    transform: translateX(120%);
  }
  100% {
    transform: translateX(120%);
  }
`;

const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 46,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 2,
    transition: 'transform 0.2s ease',
    '&.Mui-checked': {
      transform: 'translateX(20px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.mode === 'dark' ? '#3b82f6' : '#2563eb',
        opacity: 1,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    width: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: theme.palette.mode === 'dark' ? '#e2e8f0' : '#ffffff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
  },
  '& .MuiSwitch-track': {
    borderRadius: 13,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.4)' : 'rgba(100,116,139,0.35)',
    opacity: 1,
    transition: 'background-color 0.2s ease',
  },
}));

const sectionBaseSx = (theme: any) => ({
  mb: 3,
  p: 2.5,
  borderRadius: 4,
  border: '1px solid',
  borderColor: 'divider',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.35) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.85) 100%)',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 30px rgba(0,0,0,0.25)'
      : '0 12px 30px rgba(15,23,42,0.08)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 16px 40px rgba(0,0,0,0.35)'
        : '0 16px 40px rgba(15,23,42,0.12)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.16) 50%, transparent 100%)',
    transform: 'translateX(-120%)',
    animation: `${sheenShift} 8s ease-in-out infinite`,
    opacity: theme.palette.mode === 'dark' ? 0.08 : 0.2,
  },
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
});

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
    
    // Dispatch event for time format changes
    window.dispatchEvent(new CustomEvent('disgram-settings-changed'));
    
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
    alert(t('settingsReset'));
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
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(160deg, rgba(15,23,42,0.95) 0%, rgba(17,24,39,0.9) 50%, rgba(15,23,42,0.95) 100%)'
              : 'linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.9) 100%)',
          border: '1px solid',
          borderColor: 'divider',
          animation: `${dialogPop} 0.35s ease`,
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontWeight: 600,
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(120deg, rgba(30,41,59,0.9), rgba(15,23,42,0.6))'
              : 'linear-gradient(120deg, rgba(255,255,255,0.98), rgba(226,232,240,0.75))',
        })}
      >
        {t('settings')}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2, animation: `${dialogFade} 0.35s ease` }}>
        {/* Налаштування інтерфейсу */}
        <Box sx={sectionBaseSx}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('interface')}
          </Typography>
          
          <FormControlLabel
            control={
              <StyledSwitch 
                checked={isDarkTheme}
                onChange={(e) => {
                  setIsDarkTheme(e.target.checked);
                  dispatch(setTheme(e.target.checked ? 'dark' : 'light'));
                }}
              />
            }
            label={t('darkTheme')}
          />
          
          <FormControlLabel
            control={
              <StyledSwitch 
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
              />
            }
            label={t('compactMode')}
          />
          
          <FormControlLabel
            control={
              <StyledSwitch 
                checked={animations}
                onChange={(e) => setAnimations(e.target.checked)}
              />
            }
            label={t('animations')}
          />

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t('chatTextScale')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('chatTextScaleHint')}
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
        <Box sx={sectionBaseSx}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('time-language')}
          </Typography>
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>{t('timeFormat')}</InputLabel>
            <Select
              value={timeFormat}
              label={t('timeFormat')}
              onChange={(e) => setTimeFormat(e.target.value as '12' | '24')}
            >
              <MenuItem value="24">{t('timeFormat24')}</MenuItem>
              <MenuItem value="12">{t('timeFormat12')}</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <StyledSwitch 
                checked={showSeconds}
                onChange={(e) => setShowSeconds(e.target.checked)}
              />
            }
            label={t('showSeconds')}
          />

          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>{t('language')}</InputLabel>
            <Select
              value={language}
              label={t('language')}
              onChange={(e) => dispatch(setLanguage(e.target.value as Language))}
            >
              <MenuItem value="uk">{t('ukrainian')}</MenuItem>
              <MenuItem value="en">{t('english')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Налаштування сповіщень */}
        <Box sx={sectionBaseSx}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('notifications')}
          </Typography>
          
          <FormControlLabel
            control={
              <StyledSwitch 
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
            }
            label={t('soundNotif')}
          />
          
          <FormControlLabel
            control={
              <StyledSwitch 
                checked={desktopNotifications}
                onChange={(e) => setDesktopNotifications(e.target.checked)}
              />
            }
            label={t('desktopNotif')}
          />
          
          <FormControlLabel
            control={<StyledSwitch />}
            label={t('messagePreview')}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Про додаток */}
        <Box sx={(theme) => ({ ...sectionBaseSx(theme), mb: 0 })}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('about')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            LUMYN v{appVersion}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('nextGenMessenger')}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleResetSettings} variant="outlined" color="warning">
            {t('resetSettings')}
          </Button>
          <Button onClick={handleLogout} variant="outlined" color="error">
            {t('logout')}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} variant="outlined">
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {t('save')}
          </Button>
        </Box>
      </DialogActions>
      
      {/* Діалог підтвердження скидання налаштувань */}
      <ConfirmDialog
        open={confirmReset}
        title={t('resetSettings')}
        message={t('resetSettingsConfirm')}
        confirmText={t('reset')}
        cancelText={t('cancel')}
        onConfirm={confirmResetSettings}
        onCancel={() => setConfirmReset(false)}
        confirmColor="warning"
      />

      {/* Діалог підтвердження виходу */}
      <ConfirmDialog
        open={confirmLogout}
        title={t('logout')}
        message={t('logoutConfirm')}
        confirmText={t('logout')}
        cancelText={t('cancel')}
        onConfirm={confirmLogoutAction}
        onCancel={() => setConfirmLogout(false)}
        confirmColor="error"
      />
    </Dialog>
  );
};

export default SettingsDialog;
