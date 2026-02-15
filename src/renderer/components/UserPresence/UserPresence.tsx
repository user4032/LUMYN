import React from 'react';
import {
  Box,
  Avatar,
  Badge,
  Tooltip,
  Typography,
  Stack,
} from '@mui/material';
import {
  Circle as CircleIcon,
  AccessTime as AwayIcon,
  NotInterested as DNDIcon,
  Visibility as InvisibleIcon,
} from '@mui/icons-material';

interface UserPresenceProps {
  status: 'online' | 'offline' | 'idle' | 'dnd' | 'away' | 'busy' | 'invisible';
  avatar?: string;
  username: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const statusColors: Record<string, string> = {
  online: '#28a745',
  offline: '#6c757d',
  idle: '#ffc107',
  dnd: '#dc3545',
  away: '#fd7e14',
  busy: '#dc3545',
  invisible: '#6c757d',
};

const statusLabels: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  away: 'Away',
  busy: 'Busy',
  invisible: 'Invisible',
};

export const UserPresenceBadge: React.FC<UserPresenceProps> = ({
  status,
  avatar,
  username,
  size = 'medium',
  showLabel = false,
}) => {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 56,
  };

  const badgeSize = {
    small: 8,
    medium: 12,
    large: 16,
  };

  const avatarSize = sizeMap[size];
  const badgeSz = badgeSize[size];

  const statusIcon =
    status === 'dnd' ? (
      <DNDIcon sx={{ fontSize: badgeSz }} />
    ) : status === 'away' ? (
      <AwayIcon sx={{ fontSize: badgeSz }} />
    ) : status === 'idle' ? (
      <CircleIcon sx={{ fontSize: badgeSz * 1.5 }} />
    ) : (
      <CircleIcon sx={{ fontSize: badgeSz }} />
    );

  return (
    <Tooltip title={statusLabels[status]}>
      <Badge
        badgeContent={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: badgeSz,
              height: badgeSz,
              borderRadius: '50%',
              bgcolor: statusColors[status],
              border: '2px solid white',
              color: 'white',
              fontSize: 8,
            }}
          >
            {status === 'dnd' || status === 'away' ? statusIcon : <CircleIcon sx={{ fontSize: badgeSz }} />}
          </Box>
        }
        overlap="circular"
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Avatar
          src={avatar}
          alt={username}
          sx={{
            width: avatarSize,
            height: avatarSize,
          }}
        >
          {username.charAt(0).toUpperCase()}
        </Avatar>
      </Badge>
    </Tooltip>
  );
};

interface UserStatusProps {
  status: string;
  customStatus?: string;
}

export const UserStatusDisplay: React.FC<UserStatusProps> = ({ status, customStatus }) => {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: statusColors[status as keyof typeof statusColors] || '#6c757d',
        }}
      />
      <Typography variant="caption" color="textSecondary">
        {customStatus || statusLabels[status] || status}
      </Typography>
    </Stack>
  );
};
