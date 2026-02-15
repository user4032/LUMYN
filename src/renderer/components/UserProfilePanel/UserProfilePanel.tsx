import React from 'react';
import { Box, Avatar, Typography, Divider } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import { Chat } from '@store/slices/chatsSlice';

interface UserProfile {
  id: string;
  username?: string;
  displayName?: string;
  status?: 'online' | 'offline' | 'idle' | 'dnd' | 'away' | 'busy' | 'invisible';
  customStatus?: string;
  bio?: string;
  avatar?: string;
}

interface UserProfilePanelProps {
  chat: Chat;
}

const STATUS_COLORS: Record<string, string> = {
  online: '#3ba55d',
  offline: '#747f8d',
  idle: '#faa61a',
  dnd: '#ed4245',
  away: '#faa61a',
  busy: '#ed4245',
  invisible: '#747f8d',
};

const UserProfilePanel: React.FC<UserProfilePanelProps> = ({ chat }) => {
  const language = useSelector((state: RootState) => state.ui.language);
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    setUser({
      id: chat.id,
      displayName: chat.name,
      status: chat.status,
      avatar: chat.avatar,
    });

    const loadProfile = async () => {
      const token = localStorage.getItem('disgram_auth_token');
      if (!token) return;

      setLoading(true);
      try {
        const response = await fetch(`http://localhost:4777/users/${chat.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;
        const data = await response.json();
        if (!active) return;
        if (data.ok && data.user) {
          setUser(data.user);
        }
      } catch (e) {
        // Keep fallback user data
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [chat.avatar, chat.id, chat.name, chat.status]);

  const statusLabel = user?.status ? t(user.status) : t('offline');
  const statusColor = STATUS_COLORS[user?.status || 'offline'] || STATUS_COLORS.offline;
  const displayName = user?.displayName || chat.name;
  const hasBio = !!(user?.bio && user.bio.trim());

  return (
    <Box
      sx={(theme) => ({
        width: 320,
        borderLeft: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      })}
    >
      <Box sx={{ px: 2, pt: 2 }}>
        <Box
          sx={(theme) => ({
            height: 120,
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1f2937 0%, #111827 45%, #0f172a 100%)'
              : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 45%, #c7d2fe 100%)',
          })}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: -6, pb: 2 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user?.avatar}
              sx={{
                width: 96,
                height: 96,
                bgcolor: 'primary.main',
                border: '4px solid',
                borderColor: 'background.paper',
                fontSize: '2rem',
              }}
            >
              {displayName?.[0]?.toUpperCase()}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: 6,
                right: 6,
                width: 18,
                height: 18,
                borderRadius: '50%',
                border: '3px solid',
                borderColor: 'background.paper',
                bgcolor: statusColor,
              }}
            />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
            {displayName}
          </Typography>
          {user?.username && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              @{user.username}
            </Typography>
          )}

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
            }}
          >
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {statusLabel}
            </Typography>
          </Box>

          {user?.customStatus && (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
              {user.customStatus}
            </Typography>
          )}

          {loading && (
            <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary' }}>
              {t('loading')}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      <Box sx={{ px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {language === 'uk' ? "Ім'я користувача" : 'Username'}
          </Typography>
          <Typography variant="body2" sx={{ ml: 'auto' }}>
            @{user?.username || chat.name}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ px: 2, py: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          {t('aboutMe')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {hasBio ? user?.bio : t('noBio')}
        </Typography>
      </Box>
    </Box>
  );
};

export default UserProfilePanel;
