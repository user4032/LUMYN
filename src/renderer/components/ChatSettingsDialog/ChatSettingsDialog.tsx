import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Typography,
  Box,
  Stack,
  Switch,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
} from '@mui/material';
import { t } from '../../i18n';
import { getChatSettings, updateChatSettings } from '../../api/social';

interface ChatSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  token: string;
}

export const ChatSettingsDialog: React.FC<ChatSettingsDialogProps> = ({
  open,
  onClose,
  chatId,
  token,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [notificationLevel, setNotificationLevel] = useState<'all' | 'mentions' | 'none'>('all');
  const [customColor, setCustomColor] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && token) {
      loadSettings();
    }
  }, [open, chatId, token]);

  const loadSettings = async () => {
    try {
      const response = await getChatSettings(token, chatId);
      if (response.ok && response.settings) {
        setIsMuted(response.settings.isMuted);
        setIsFavorite(response.settings.isFavorite);
        setIsArchived(response.settings.isArchived);
        setNotificationLevel(response.settings.notificationLevel);
        setCustomColor(response.settings.customColor || '');
        setCustomEmoji(response.settings.customEmoji || '');
      }
    } catch (error) {
      console.error('Failed to load chat settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateChatSettings(token, chatId, {
        isMuted,
        isFavorite,
        isArchived,
        notificationLevel,
        customColor,
        customEmoji,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save chat settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('chatSettings')}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          {/* Mute */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isMuted}
                  onChange={(e) => setIsMuted(e.target.checked)}
                />
              }
              label={t('mute')}
            />
            <Typography variant="caption" color="textSecondary">
              Не отримувати сповіщення з цього чату
            </Typography>
          </Box>

          {/* Favorite */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                />
              }
              label={t('favorite')}
            />
            <Typography variant="caption" color="textSecondary">
              Закріпити чат у верхній частині списку
            </Typography>
          </Box>

          {/* Archive */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                />
              }
              label={t('archive')}
            />
            <Typography variant="caption" color="textSecondary">
              Приховати чат зі стандартного списку
            </Typography>
          </Box>

          {/* Notification Level */}
          <FormControl fullWidth>
            <InputLabel>{t('notificationLevel')}</InputLabel>
            <Select
              value={notificationLevel}
              onChange={(e) => setNotificationLevel(e.target.value as any)}
              label="Notifications"
            >
              <MenuItem value="all">{t('all')}</MenuItem>
              <MenuItem value="mentions">{t('mentions')}</MenuItem>
              <MenuItem value="none">{t('none')}</MenuItem>
            </Select>
          </FormControl>

          {/* Custom Color */}
          <TextField
            label={t('customColor')}
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          {/* Custom Emoji */}
          <TextField
            label={t('customEmoji')}
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value.slice(0, 2))}
            placeholder="🎨"
            inputProps={{ maxLength: 2 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
