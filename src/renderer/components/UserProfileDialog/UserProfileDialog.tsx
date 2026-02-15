import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Avatar,
  Typography,
  IconButton,
  Divider,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Message as MessageIcon,
  Phone as PhoneIcon,
  NotificationsOff as NotificationsOffIcon,
  MoreHoriz as MoreHorizIcon,
  AlternateEmail as AlternateEmailIcon,
  Cake as CakeIcon,
  Share as ShareIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import ProfileDialog from '../ProfileDialog/ProfileDialog';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'offline' | 'idle' | 'dnd' | 'away' | 'busy' | 'invisible';
  customStatus?: string;
  bio?: string;
}

interface UserProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onMessage?: (userId: string) => void;
}

const STATUS_COLORS = {
  online: '#3ba55d',
  offline: '#747f8d',
  idle: '#faa61a',
  dnd: '#ed4245',
  away: '#faa61a',
  busy: '#ed4245',
  invisible: '#747f8d',
};

const UserProfileDialog: React.FC<UserProfileDialogProps> = ({ open, onClose, user, onMessage }) => {
  const language = useSelector((state: RootState) => state.ui.language);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false);
  const [profileBanner, setProfileBanner] = React.useState<string | null>(null);
  const [profileBirthday, setProfileBirthday] = React.useState<string | null>(null);
  const [profileFrame, setProfileFrame] = React.useState('default');
  const isSelf = !!(user && currentUser?.id === user.id);

  const handleSendMessage = () => {
    if (onMessage && user) {
      onMessage(user.id);
      onClose();
    }
  };

  const statusLabels = {
    online: t('statusOnline', language),
    offline: t('statusOffline', language),
    idle: t('idle', language),
    dnd: t('dnd', language),
    away: t('away', language),
    busy: t('busy', language),
    invisible: t('invisible', language),
  } as const;

  React.useEffect(() => {
    if (!open || !isSelf) return;
    try {
      setProfileBanner(localStorage.getItem('disgram_profile_banner'));
      setProfileBirthday(localStorage.getItem('disgram_profile_birthday'));
      setProfileFrame(localStorage.getItem('disgram_profile_frame') || 'default');
    } catch (e) {
      setProfileBanner(null);
      setProfileBirthday(null);
      setProfileFrame('default');
    }
  }, [open, isSelf]);

  const frameStyles: Record<string, { bg: string; glow: string; border: string }> = {
    default: {
      bg: 'linear-gradient(180deg, #5865F2 0%, #5865F2 100%)',
      glow: '0 0 12px rgba(88,101,242,0.5)',
      border: '2px solid #5865F2',
    },
    neon: {
      bg: 'conic-gradient(from 120deg, #00f5ff, #7c4dff, #00f5ff)',
      glow: '0 0 12px rgba(124,77,255,0.6)',
      border: '2px solid #7c4dff',
    },
    aurora: {
      bg: 'radial-gradient(circle at 25% 25%, rgba(87,242,135,0.9), transparent 45%), radial-gradient(circle at 75% 75%, rgba(88,101,242,0.9), transparent 45%), conic-gradient(#1f2937, #111827)',
      glow: '0 0 14px rgba(87,242,135,0.45)',
      border: '2px solid rgba(88,101,242,0.9)',
    },
    ember: {
      bg: 'conic-gradient(#f9a826, #ed4245, #f9a826)',
      glow: '0 0 12px rgba(249,168,38,0.5)',
      border: '2px solid #ed4245',
    },
    cobalt: {
      bg: 'repeating-conic-gradient(#22d3ee 0 12deg, #3b82f6 12deg 24deg)',
      glow: '0 0 12px rgba(34,211,238,0.45)',
      border: '2px solid #22d3ee',
    },
    glitch: {
      bg: 'linear-gradient(135deg, #eb459e 0%, #5865F2 50%, #57F287 100%)',
      glow: '0 0 12px rgba(235,69,158,0.45)',
      border: '2px solid #eb459e',
    },
  };

  const formatBirthday = (value: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parts = trimmed.split('-');
    let day = '';
    let month = '';
    let year = '';
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parts[0];
        month = String(Number(parts[1]));
        day = String(Number(parts[2]));
      } else {
        year = parts[2];
        month = String(Number(parts[0]));
        day = String(Number(parts[1]));
      }
    } else if (parts.length === 2) {
      month = String(Number(parts[0]));
      day = String(Number(parts[1]));
    }
    if (!day || !month) return null;
    const ukMonths = ['січ.', 'лют.', 'бер.', 'квіт.', 'трав.', 'черв.', 'лип.', 'серп.', 'вер.', 'жовт.', 'лист.', 'груд.'];
    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabel = language === 'uk'
      ? ukMonths[Number(month) - 1] || month
      : enMonths[Number(month) - 1] || month;
    return year ? `${day} ${monthLabel} ${year}` : `${day} ${monthLabel}`;
  };

  if (!user) return null;

  const handleOpenProfile = () => {
    setProfileDialogOpen(true);
  };

  const actionItems = isSelf
    ? [
        {
          key: 'profile',
          label: language === 'uk' ? 'Мій профіль' : 'My profile',
          icon: <EditIcon fontSize="small" />,
          onClick: handleOpenProfile,
        },
      ]
    : [
        {
          key: 'message',
          label: language === 'uk' ? 'Написати' : 'Message',
          icon: <MessageIcon fontSize="small" />,
          onClick: handleSendMessage,
        },
        {
          key: 'mute',
          label: language === 'uk' ? 'Не сповіщати' : 'Mute',
          icon: <NotificationsOffIcon fontSize="small" />,
        },
        {
          key: 'call',
          label: language === 'uk' ? 'Виклик' : 'Call',
          icon: <PhoneIcon fontSize="small" />,
        },
        {
          key: 'more',
          label: language === 'uk' ? 'Більше' : 'More',
          icon: <MoreHorizIcon fontSize="small" />,
        },
      ];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper',
          },
        }}
      >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {isSelf && (
            <IconButton size="small" onClick={handleOpenProfile}>
              <EditIcon />
            </IconButton>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 2 }}>
          {isSelf && (
            <Box
              sx={{
                width: '100%',
                height: 120,
                borderRadius: 2,
                mb: -6,
                backgroundImage: profileBanner ? `url(${profileBanner})` : 'linear-gradient(135deg, #3a3f47 0%, #2b2f35 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
          <Box sx={{ position: 'relative', mb: 1.5 }}>
            {isSelf && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -6,
                  left: -6,
                  width: 132,
                  height: 132,
                  borderRadius: '50%',
                  border: frameStyles[profileFrame]?.border || frameStyles.default.border,
                  boxShadow: frameStyles[profileFrame]?.glow || frameStyles.default.glow,
                  backgroundImage: frameStyles[profileFrame]?.bg || frameStyles.default.bg,
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(50% - 6px), #000 calc(50% - 5px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(50% - 6px), #000 calc(50% - 5px))',
                  pointerEvents: 'none',
                }}
              />
            )}
            <Avatar
              src={user.avatar}
              sx={{
                width: 120,
                height: 120,
                fontSize: '3rem',
                bgcolor: 'secondary.main',
                color: '#ffffff',
              }}
            >
              {user.displayName[0].toUpperCase()}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 26,
                height: 26,
                borderRadius: '50%',
                border: '4px solid',
                borderColor: 'background.paper',
                bgcolor: STATUS_COLORS[user.status],
              }}
            />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {user.displayName}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            @{user.username}
          </Typography>

          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: STATUS_COLORS[user.status] }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {statusLabels[user.status]}
            </Typography>
          </Box>

          <Box sx={{ width: '100%', mt: 2, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            {actionItems.map((item) => (
              <Button
                key={item.key}
                onClick={item.onClick}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  py: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </Box>

          <Divider sx={{ width: '100%', my: 2 }} />

          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AlternateEmailIcon fontSize="small" />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {language === 'uk' ? "Ім'я користувача" : 'Username'}
              </Typography>
              <Typography variant="body2" sx={{ ml: 'auto' }}>
                @{user.username}
              </Typography>
            </Box>

            {isSelf && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CakeIcon fontSize="small" />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {language === 'uk' ? 'День народження' : 'Birthday'}
                </Typography>
                <Typography variant="body2" sx={{ ml: 'auto' }}>
                  {formatBirthday(profileBirthday) || (language === 'uk' ? 'Не задано' : 'Not set')}
                </Typography>
              </Box>
            )}
          </Box>

          {!isSelf && onMessage && (
            <Button
              variant="contained"
              fullWidth
              startIcon={<ShareIcon />}
              onClick={handleSendMessage}
              sx={{
                mt: 3,
                py: 1.25,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {language === 'uk' ? 'Поділитися контактом' : 'Share contact'}
            </Button>
          )}
        </Box>
      </DialogContent>
      </Dialog>

      <ProfileDialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} />
    </>
  );
};

export default UserProfileDialog;
