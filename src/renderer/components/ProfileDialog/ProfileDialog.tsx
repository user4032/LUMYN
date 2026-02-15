import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  TextField,
  MenuItem,
  Divider,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { PhotoCamera as CameraIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store';
import { updateStatus, setUser, updateAvatar } from '@store/slices/userSlice';
import { updateMyAvatar } from '@store/slices/chatsSlice';
import { t } from '@i18n/index';
import { updateProfile } from '@/renderer/api/auth';
import AvatarPickerDialog from '../AvatarPickerDialog/AvatarPickerDialog';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: 'online', color: '#3ba55d', labelKey: 'statusOnline' },
  { value: 'offline', color: '#747f8d', labelKey: 'statusOffline' },
];

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const language = useSelector((state: RootState) => state.ui.language);
  
  const [displayName, setDisplayName] = React.useState(currentUser?.displayName || '');
  const [username, setUsername] = React.useState(currentUser?.username || '');
  const [bio, setBio] = React.useState(currentUser?.bio || '');
  const [customStatus, setCustomStatus] = React.useState(currentUser?.customStatus || '');
  const [status, setStatus] = React.useState(currentUser?.status || 'online');
  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [profileBanner, setProfileBanner] = React.useState('');
  const [profileFrame, setProfileFrame] = React.useState('default');
  const [birthDay, setBirthDay] = React.useState('');
  const [birthMonth, setBirthMonth] = React.useState('');
  const [birthYear, setBirthYear] = React.useState('');
  const [usernameError, setUsernameError] = React.useState('');
  const [saveError, setSaveError] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = React.useState(false);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  // Валідація формату username: a-z, A-Z, 0-9, ., -, _
  const validateUsernameFormat = (value: string): boolean => {
    return /^[a-zA-Z0-9._-]*$/.test(value);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Дозволяємо лише валідні символи, інші видаляємо автоматично
    const filtered = value.replace(/[^a-zA-Z0-9._-]/g, '');
    setUsername(filtered);
    setUsernameError('');
  };

  const parseBirthday = (value: string | null) => {
    if (!value) return { day: '', month: '', year: '' };
    const trimmed = value.trim();
    if (!trimmed) return { day: '', month: '', year: '' };
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return {
          year: parts[0],
          month: String(Number(parts[1])),
          day: String(Number(parts[2])),
        };
      }
      return {
        year: parts[2],
        month: String(Number(parts[0])),
        day: String(Number(parts[1])),
      };
    }
    if (parts.length === 2) {
      return {
        year: '',
        month: String(Number(parts[0])),
        day: String(Number(parts[1])),
      };
    }
    return { day: '', month: '', year: '' };
  };

  React.useEffect(() => {
    if (open && currentUser) {
      setDisplayName(currentUser.displayName || '');
      setUsername(currentUser.username || '');
      setBio(currentUser.bio || '');
      setCustomStatus(currentUser.customStatus || '');
      setStatus(currentUser.status || 'online');
      setAvatarUrl(currentUser.avatar || '');
      try {
        // Завантажуємо банер спочатку з currentUser, потім з localStorage
        setProfileBanner(currentUser.profileBanner || localStorage.getItem('disgram_profile_banner') || '');
        setProfileFrame(currentUser.profileFrame || localStorage.getItem('disgram_profile_frame') || 'default');
        const parsedBirthday = parseBirthday(localStorage.getItem('disgram_profile_birthday'));
        setBirthDay(parsedBirthday.day);
        setBirthMonth(parsedBirthday.month);
        setBirthYear(parsedBirthday.year);
      } catch (e) {
        setProfileBanner(currentUser.profileBanner || '');
        setProfileFrame(currentUser.profileFrame || 'default');
        setBirthDay('');
        setBirthMonth('');
        setBirthYear('');
      }
      setUsernameError('');
    }
  }, [open, currentUser]);

  const handleSave = async () => {
    const trimmedUsername = username.trim();
    
    // Валідація username
    if (!trimmedUsername) {
      setUsernameError(t('usernameRequired', language));
      return;
    }
    if (trimmedUsername.length < 4) {
      setUsernameError(t('usernameMin', language));
      return;
    }
    if (!validateUsernameFormat(trimmedUsername)) {
      setUsernameError(t('usernameInvalidChars', language));
      return;
    }
    
    setUsernameError('');
    setSaveError('');
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('disgram_auth_token');
      if (!token) {
        throw new Error(t('notAuthenticated', language));
      }

      const profileData: any = {
        status,
      };
      
      // Передаємо bio тільки якщо воно змінилось
      if (bio !== (currentUser?.bio || '')) {
        profileData.bio = bio;
      }
      
      // Передаємо customStatus тільки якщо воно змінилось
      if (customStatus !== (currentUser?.customStatus || '')) {
        profileData.customStatus = customStatus;
      }
      
      // Передаємо username тільки якщо він змінився
      if (trimmedUsername !== currentUser?.username) {
        profileData.username = trimmedUsername;
      }
      
      // Передаємо displayName тільки якщо він не порожній
      if (displayName && displayName.trim()) {
        profileData.displayName = displayName.trim();
      }
      
      // Передаємо аватар тільки якщо він змінився
      if (avatarUrl && avatarUrl !== currentUser?.avatar) {
        profileData.avatar = avatarUrl;
      }

      if (profileBanner !== (currentUser?.profileBanner || '')) {
        profileData.profileBanner = profileBanner;
      }

      if (profileFrame !== (currentUser?.profileFrame || 'default')) {
        profileData.profileFrame = profileFrame;
      }

      if (profileBanner !== (currentUser?.profileBanner || '')) {
        profileData.profileBanner = profileBanner;
      }

      if (profileFrame !== (currentUser?.profileFrame || 'default')) {
        profileData.profileFrame = profileFrame;
      }
      
      console.log('Profile data to send:', {
        username: trimmedUsername,
        displayName,
        bio,
        customStatus,
        status,
        hasNewAvatar: !!(avatarUrl && avatarUrl !== currentUser?.avatar),
        avatarSize: profileData.avatar ? profileData.avatar.length : 0,
      });
      
      const response = await updateProfile(token, profileData);
      
      console.log('Profile update response received:', {
        ok: response.ok,
        user: {
          username: response.user?.username,
          avatar: response.user?.avatar ? `${response.user.avatar.substring(0, 50)}...` : null,
          status: response.user?.status,
        },
      });

      if (response.user) {
        const updatedUser = {
          ...currentUser,
          ...response.user,
        };
        
        console.log('Updating Redux with:', {
          currentUserAvatar: currentUser?.avatar,
          responseUserAvatar: response.user.avatar,
          mergedUserAvatar: updatedUser.avatar,
          currentUserStatus: currentUser?.status,
          responseUserStatus: response.user.status,
          mergedUserStatus: updatedUser.status,
        });
        
        dispatch(setUser(updatedUser));
        dispatch(updateStatus(status));
        
        try {
          localStorage.setItem('disgram_user', JSON.stringify(updatedUser));
        } catch (e) {
          console.error('Failed to save user locally:', e);
        }
        
        try {
          const normalizedMonth = birthMonth ? birthMonth.padStart(2, '0') : '';
          const normalizedDay = birthDay ? birthDay.padStart(2, '0') : '';
          let storedBirthday = '';
          if (normalizedMonth && normalizedDay) {
            storedBirthday = birthYear
              ? `${birthYear}-${normalizedMonth}-${normalizedDay}`
              : `${normalizedMonth}-${normalizedDay}`;
          }
          localStorage.setItem('disgram_profile_banner', profileBanner);
          localStorage.setItem('disgram_profile_frame', profileFrame);
          localStorage.setItem('disgram_profile_birthday', storedBirthday);
        } catch (e) {
          console.error('Failed to save profile extras:', e);
        }

        onClose();
      }
    } catch (err: any) {
      setSaveError(err.message || t('saveFailed', language));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Обмежуємо розмір на 500KB
      if (file.size > 500 * 1024) {
        setSaveError('Avatar too large (max 500KB)');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        console.log('Avatar selected:', {
          filename: file.name,
          size: file.size,
          base64Length: base64.length,
        });
        setAvatarUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    if (currentUser) {
      setAvatarUrl(avatarUrl);
      // Оновлюємо локально в userSlice
      dispatch(updateAvatar(avatarUrl));
      
      // Оновлюємо аватар в чатах та повідомленнях
      dispatch(updateMyAvatar({
        userId: currentUser.id,
        avatar: avatarUrl,
      }));
      
      // Оновлюємо на сервері
      try {
        const token = localStorage.getItem('disgram_auth_token');
        if (token) {
          await updateProfile(token, { avatar: avatarUrl });
        }
      } catch (err) {
        console.error('Failed to update avatar:', err);
      }
      
      setAvatarPickerOpen(false);
    }
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setProfileBanner(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', fontWeight: 600 }}>
        {t('myProfile', language)}
      </DialogTitle>
      
      <DialogContent sx={{ mt: 2 }}>
        {/* Аватар */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, position: 'relative' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={avatarUrl}
              sx={(theme) => ({
                width: 100,
                height: 100,
                bgcolor: theme.palette.primary.main,
                color: '#ffffff',
                fontSize: '2rem',
                fontWeight: 600,
              })}
            >
              {currentUser?.displayName?.[0] || 'ME'}
            </Avatar>
            <IconButton
              component="label"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'primary.main',
                color: 'white',
                width: 32,
                height: 32,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <CameraIcon fontSize="small" />
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </IconButton>
          </Box>
        </Box>

        {/* Банер профілю */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {t('profileBanner', language)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              value={profileBanner}
              onChange={(e) => setProfileBanner(e.target.value)}
              fullWidth
              size="small"
              placeholder="https://example.com/banner.jpg"
            />
            <Button
              variant="outlined"
              onClick={() => bannerInputRef.current?.click()}
              sx={{ mt: 0.5 }}
            >
              {language === 'en' ? 'Upload' : 'Завантажити'}
            </Button>
          </Box>
          <input
            ref={bannerInputRef}
            type="file"
            hidden
            accept="image/*"
            onChange={handleBannerUpload}
          />
          {profileBanner && (
            <Box
              sx={{
                mt: 2,
                height: 120,
                borderRadius: 2,
                backgroundImage: `url(${profileBanner})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid',
                borderColor: 'divider',
              }}
            />
          )}
        </Box>

        {/* Рамка аватару */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {t('profileFrame', language)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              {
                id: 'default',
                label: language === 'uk' ? 'Класика' : 'Classic',
                bg: 'linear-gradient(180deg, #5865F2 0%, #5865F2 100%)',
                glow: '0 0 10px rgba(88,101,242,0.5)',
                border: '2px solid #5865F2',
              },
              {
                id: 'neon',
                label: language === 'uk' ? 'Неон' : 'Neon',
                bg: 'conic-gradient(from 120deg, #00f5ff, #7c4dff, #00f5ff)',
                glow: '0 0 12px rgba(124,77,255,0.6)',
                border: '2px solid #7c4dff',
              },
              {
                id: 'aurora',
                label: language === 'uk' ? 'Аврора' : 'Aurora',
                bg: 'radial-gradient(circle at 25% 25%, rgba(87,242,135,0.9), transparent 45%), radial-gradient(circle at 75% 75%, rgba(88,101,242,0.9), transparent 45%), conic-gradient(#1f2937, #111827)',
                glow: '0 0 14px rgba(87,242,135,0.45)',
                border: '2px solid rgba(88,101,242,0.9)',
              },
              {
                id: 'ember',
                label: language === 'uk' ? 'Іскра' : 'Ember',
                bg: 'conic-gradient(#f9a826, #ed4245, #f9a826)',
                glow: '0 0 12px rgba(249,168,38,0.5)',
                border: '2px solid #ed4245',
              },
              {
                id: 'cobalt',
                label: language === 'uk' ? 'Кобальт' : 'Cobalt',
                bg: 'repeating-conic-gradient(#22d3ee 0 12deg, #3b82f6 12deg 24deg)',
                glow: '0 0 12px rgba(34,211,238,0.45)',
                border: '2px solid #22d3ee',
              },
              {
                id: 'glitch',
                label: language === 'uk' ? 'Глітч' : 'Glitch',
                bg: 'linear-gradient(135deg, #eb459e 0%, #5865F2 50%, #57F287 100%)',
                glow: '0 0 12px rgba(235,69,158,0.45)',
                border: '2px solid #eb459e',
              },
            ].map((frame) => (
              <Button
                key={frame.id}
                variant={profileFrame === frame.id ? 'contained' : 'outlined'}
                onClick={() => setProfileFrame(frame.id)}
                sx={{
                  minWidth: 0,
                  px: 1,
                  py: 0.75,
                  borderRadius: 2,
                  textTransform: 'none',
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: frame.border,
                    boxShadow: frame.glow,
                    backgroundImage: frame.bg,
                    WebkitMask: 'radial-gradient(farthest-side, transparent calc(50% - 4px), #000 calc(50% - 3px))',
                    mask: 'radial-gradient(farthest-side, transparent calc(50% - 4px), #000 calc(50% - 3px))',
                  }}
                />
                <Typography variant="caption">{frame.label}</Typography>
              </Button>
            ))}
          </Box>
        </Box>

        {/* Кнопка вибору стандартного аватара */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => setAvatarPickerOpen(true)}
          >
            {language === 'en' ? 'Choose from Gallery' : 'Вибрати зі стандартних'}
          </Button>
        </Box>

        {/* Ім'я */}
        <TextField
          fullWidth
          label={t('displayNameLabel', language)}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          size="small"
          sx={{ mb: 2 }}
        />

        {/* Помилка збереження */}
        {saveError && (
          <Typography variant="caption" sx={{ color: 'error.main', mb: 2, display: 'block' }}>
            {saveError}
          </Typography>
        )}

        {/* Username */}
        <TextField
          fullWidth
          label={t('usernameLabel', language)}
          value={username}
          onChange={handleUsernameChange}
          size="small"
          sx={{ mb: 2 }}
          error={!!usernameError}
          helperText={usernameError || t('usernameHint', language)}
        />

        <TextField
          fullWidth
          label={t('emailLabel', language)}
          value={currentUser?.email || ''}
          disabled
          size="small"
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {t('birthdayLabel', language)}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
            <TextField
              select
              size="small"
              label={t('birthdayMonth', language)}
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <MenuItem key={idx + 1} value={String(idx + 1)}>
                  {language === 'uk'
                    ? ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'][idx]
                    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label={t('birthdayDay', language)}
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
            >
              {Array.from({ length: 31 }).map((_, idx) => (
                <MenuItem key={idx + 1} value={String(idx + 1)}>
                  {idx + 1}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label={t('birthdayYearOptional', language)}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            >
              <MenuItem value="">{language === 'uk' ? 'Не вказувати' : 'Not set'}</MenuItem>
              {Array.from({ length: 100 }).map((_, idx) => {
                const year = String(new Date().getFullYear() - idx);
                return (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                );
              })}
            </TextField>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Статус */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {t('statusLabel', language)}
        </Typography>
        <TextField
          fullWidth
          select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          size="small"
          sx={{ mb: 2 }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: option.color,
                  }}
                />
                {t(option.labelKey, language)}
              </Box>
            </MenuItem>
          ))}
        </TextField>

        {/* Власний статус */}
        <TextField
          fullWidth
          label={t('customStatusLabel', language)}
          value={customStatus}
          onChange={(e) => setCustomStatus(e.target.value)}
          placeholder={t('customStatusPlaceholder', language)}
          size="small"
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        {/* Біо */}
        <TextField
          fullWidth
          label={t('aboutMe', language)}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          multiline
          rows={3}
          placeholder={t('aboutMePlaceholder', language)}
          size="small"
        />
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={isSaving}>
          {t('cancel', language)}
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} /> : undefined}
        >
          {isSaving ? t('saving', language) : t('save', language)}
        </Button>
      </DialogActions>
    </Dialog>
    
    <AvatarPickerDialog
      open={avatarPickerOpen}
      onClose={() => setAvatarPickerOpen(false)}
      onSelect={handleAvatarSelect}
    />
    </>
  );
};

export default ProfileDialog;
