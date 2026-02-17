import React, { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, Avatar, Badge, Typography, Popover, Paper } from '@mui/material';
import { Add as AddIcon, DynamicFeed as ThreadsIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store';
import { setActiveServer, setActiveChannel, addServer } from '@store/slices/serversSlice';
import { t } from '@i18n/index';
import SettingsDialog from '../SettingsDialog/SettingsDialog';
import ProfileDialog from '../ProfileDialog/ProfileDialog';
import { NotificationsPanel } from '../NotificationsPanel/NotificationsPanel';
import CreateServerDialog from '../CreateServerDialog/CreateServerDialog';
import { createServer, joinServer } from '@/renderer/api/social';
import {
  BrutalChatIcon,
  BrutalServersIcon,
  BrutalSettingsIcon,
  BrutalBellIcon,
} from '../icons/BrutalIcons';
import appLogo from '../../assets/app-logo-preview.png';

interface SidebarProps {
  currentView: 'chats' | 'servers' | 'threads';
  onViewChange: (view: 'chats' | 'servers' | 'threads') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const dispatch = useDispatch();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [serversExpanded, setServersExpanded] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [createServerOpen, setCreateServerOpen] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [hoveredServerId, setHoveredServerId] = useState<string | null>(null);
  const popoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Завантажуємо користувацьке лого
    try {
      const logo = localStorage.getItem('disgram_logo');
      setCustomLogo(logo);
    } catch (e) {
      // Використовуємо стандартне лого
    }

    // Слухаємо для оновлення логотипу
    const handleLogoUpdate = () => {
      try {
        const logo = localStorage.getItem('disgram_logo');
        setCustomLogo(logo);
      } catch (e) {
        // Використовуємо стандартне лого
      }
    };

    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate);
      if (popoverTimeoutRef.current) {
        clearTimeout(popoverTimeoutRef.current);
      }
    };
  }, []);

  const chats = useSelector((state: RootState) => state.chats.chats);
  const servers = useSelector((state: RootState) => state.servers.servers);
  const activeServer = useSelector((state: RootState) => state.servers.activeServer);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const language = useSelector((state: RootState) => state.ui.language);
  const notificationsUnreadCount = useSelector((state: RootState) => state.notifications.unreadCount);
  
  // Рахуємо непрочитані сповіщення
  const unreadCount = notificationsUnreadCount;

  const handleSelectServer = (serverId: string) => {
    dispatch(setActiveServer(serverId));
    onViewChange('servers');
    
    // Встановлюємо перший текстовий канал
    const server = servers.find(s => s.id === serverId);
    if (server) {
      const firstTextChannel = server.channels.find(ch => ch.type === 'text');
      if (firstTextChannel) {
        dispatch(setActiveChannel(firstTextChannel.id));
      }
    }
  };

  const handleCreateServer = async (name: string, channels?: any[], banner?: string) => {
    try {
      if (!currentUser?.token) {
        alert('No authentication token available');
        return;
      }
      
      // Use template channels if provided, otherwise default channels
      const serverChannels = channels && channels.length > 0 ? channels : [
        { id: 'general', name: 'загальний', type: 'text' },
        { id: 'voice', name: 'Голосовий', type: 'voice' }
      ];
      
      // Create server with optional banner
      const response = await createServer(currentUser.token, name, serverChannels, banner);
      if (response.ok) {
        dispatch(addServer(response.server));
        setCreateServerOpen(false);
        alert(`${t('serverCreated')}\n${t('inviteCode')}: ${response.server.inviteCode}`);
      } else {
        alert(t('serverCreationFailed') + (response.error ? `\n${response.error}` : ''));
      }
    } catch (error) {
      console.error('Failed to create server:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(
        `${t('serverCreationFailed')}\n\n` +
        `${errorMessage}\n\n` +
        `Hint: Make sure backend server is running (node server/index.js)`
      );
    }
  };

  const handleJoinServer = async (code: string) => {
    try {
      if (!currentUser?.token) {
        alert('No authentication token available');
        return;
      }
      const response = await joinServer(currentUser.token, code);
      if (response.ok) {
        dispatch(addServer(response.server));
        setCreateServerOpen(false);
        alert(t('serverJoined'));
      } else {
        alert(t('serverJoinFailed') + (response.error ? `\n${response.error}` : ''));
      }
    } catch (error) {
      console.error('Failed to join server:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(
        `${t('serverJoinFailed')}\n\n` +
        `${errorMessage}\n\n` +
        `Hint: Make sure backend server is running (node server/index.js)`
      );
    }
  };

  return (
    <>
      <Box
        sx={(theme) => ({
          width: 72,
          bgcolor: theme.palette.mode === 'dark' ? '#202225' : '#f2f3f5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          gap: 1,
          borderRight: `1px solid ${theme.palette.divider}`,
          height: '100vh',
        })}
      >
        {/* Лого з індикатором повідомлень */}
        <Box sx={{ mb: 2, position: 'relative' }}>
          <Tooltip title={t('home')} placement="right">
            <Box
              onClick={(e) => {
                if (unreadCount > 0) {
                  setShowNotifications(true);
                } else {
                  onViewChange('chats');
                  setServersExpanded(false);
                }
              }}
              sx={(theme) => ({
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#ffffff',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderRadius: '35%',
                  bgcolor: theme.palette.primary.dark,
                },
                overflow: 'hidden',
                position: 'relative',
              })}
            >
              {customLogo ? (
                <Box
                  component="img"
                  src={customLogo}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                />
              ) : (
                <Box
                  component="img"
                  src={appLogo}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    filter: 'invert(1)',
                  }}
                />
              )}
              {unreadCount > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                    border: '2px solid background.paper',
                  }}
                />
              )}
            </Box>
          </Tooltip>
        </Box>

        {/* Навігація */}
        <Tooltip title={t('chatsLabel')} placement="right">
          <IconButton
            onClick={() => {
              onViewChange('chats');
              setServersExpanded(false);
            }}
            sx={(theme) => ({
              width: 48,
              height: 48,
              borderRadius: currentView === 'chats' ? '35%' : '50%',
              bgcolor: currentView === 'chats' ? theme.palette.primary.main : 'transparent',
              color: currentView === 'chats' ? '#ffffff' : theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderRadius: '35%',
                bgcolor: currentView === 'chats' ? theme.palette.primary.dark : theme.palette.action.hover,
                color: currentView === 'chats' ? '#ffffff' : theme.palette.text.primary,
              },
            })}
          >
            <BrutalChatIcon />
          </IconButton>
        </Tooltip>

        {/* Threads temporarily unavailable */}
        <Tooltip title={`${t('threadsLabel')} - ${t('unavailable')}`} placement="right">
          <span>
            <IconButton
              disabled
              sx={(theme) => ({
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'transparent',
                color: theme.palette.text.disabled,
                cursor: 'not-allowed',
              })}
            >
              <ThreadsIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={serversExpanded ? t('hideServers') : t('serversLabel')} placement="right">
          <IconButton
            onClick={() => {
              if (!serversExpanded) {
                onViewChange('servers');
              }
              setServersExpanded(!serversExpanded);
            }}
            sx={(theme) => ({
              width: 48,
              height: 48,
              borderRadius: currentView === 'servers' || serversExpanded ? '35%' : '50%',
              bgcolor: currentView === 'servers' || serversExpanded ? theme.palette.primary.main : 'transparent',
              color: currentView === 'servers' || serversExpanded ? '#ffffff' : theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                borderRadius: '35%',
                bgcolor: currentView === 'servers' || serversExpanded ? theme.palette.primary.dark : theme.palette.action.hover,
                color: currentView === 'servers' || serversExpanded ? '#ffffff' : theme.palette.text.primary,
              },
            })}
          >
            <BrutalServersIcon />
          </IconButton>
        </Tooltip>

        {/* Список серверів */}
        {serversExpanded && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              py: 1,
              px: 0.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
            {servers.map((server) => {
              const isHovered = hoveredServerId === server.id;
              return (
                <Box
                  key={server.id}
                  onMouseEnter={(e) => {
                    if (popoverTimeoutRef.current) {
                      clearTimeout(popoverTimeoutRef.current);
                    }
                    setPopoverAnchor(e.currentTarget);
                    setHoveredServerId(server.id);
                  }}
                  onMouseLeave={() => {
                    popoverTimeoutRef.current = setTimeout(() => {
                      setPopoverAnchor(null);
                      setHoveredServerId(null);
                    }, 200);
                  }}
                  onClick={() => {
                    handleSelectServer(server.id);
                    setPopoverAnchor(null);
                    setHoveredServerId(null);
                  }}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <Avatar
                    src={server.icon || undefined}
                    sx={(theme) => ({
                      width: 48,
                      height: 48,
                      bgcolor: activeServer === server.id || isHovered
                        ? theme.palette.primary.main
                        : theme.palette.mode === 'dark'
                          ? '#36393f'
                          : '#ffffff',
                      fontSize: '1rem',
                      fontWeight: 600,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: activeServer === server.id || isHovered ? '35%' : '50%',
                      color: activeServer === server.id || isHovered ? '#ffffff' : theme.palette.text.primary,
                      position: 'relative',
                      '&:hover': {
                        borderRadius: '35%',
                        bgcolor: activeServer === server.id ? theme.palette.primary.dark : theme.palette.primary.main,
                        color: '#ffffff',
                      },
                    })}
                  >
                    {!server.icon && server.name[0].toUpperCase()}
                  </Avatar>
                  <Box
                    sx={(theme) => ({
                      position: 'absolute',
                      left: 'calc(100% + 10px)',
                      top: '50%',
                      transform: isHovered ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-6px)',
                      opacity: isHovered ? 1 : 0,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      px: 1.25,
                      py: 0.6,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      letterSpacing: '0.01em',
                      color: theme.palette.mode === 'dark' ? '#e2e8f0' : '#0f172a',
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(15, 23, 42, 0.92)'
                          : 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid',
                      borderColor: theme.palette.divider,
                      boxShadow:
                        theme.palette.mode === 'dark'
                          ? '0 10px 24px rgba(0,0,0,0.35)'
                          : '0 10px 24px rgba(15,23,42,0.12)',
                      transition: 'all 0.2s ease',
                      zIndex: 5,
                    })}
                  >
                    {server.name}
                  </Box>

                {/* Popover with server info */}
                <Popover
                  open={hoveredServerId === server.id && !!popoverAnchor}
                  anchorEl={popoverAnchor}
                  onClose={() => {
                    setPopoverAnchor(null);
                    setHoveredServerId(null);
                  }}
                  sx={{ pointerEvents: 'none' }}
                  anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                  }}
                  slotProps={{
                    paper: {
                      onMouseEnter: () => {
                        if (popoverTimeoutRef.current) {
                          clearTimeout(popoverTimeoutRef.current);
                        }
                      },
                      onMouseLeave: () => {
                        popoverTimeoutRef.current = setTimeout(() => {
                          setPopoverAnchor(null);
                          setHoveredServerId(null);
                        }, 200);
                      },
                      sx: {
                        pointerEvents: 'auto',
                        ml: 1,
                      },
                    },
                  }}
                >
                  <Paper
                    sx={{
                      p: 0,
                      width: 280,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Banner */}
                    {server.banner && (
                      <Box
                        sx={{
                          width: '100%',
                          height: 120,
                          backgroundImage: `url('${server.banner}')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                    )}

                    {/* Content */}
                    <Box 
                      sx={{ p: 2, cursor: 'pointer' }}
                      onClick={() => {
                        handleSelectServer(server.id);
                        setPopoverAnchor(null);
                        setHoveredServerId(null);
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight={600}>
                        {server.name}
                      </Typography>
                      {server.description && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                          {server.description}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 2, display: 'block' }}>
                        {server.members?.length || 1} {t('members') || 'members'}
                      </Typography>
                    </Box>
                  </Paper>
                </Popover>
              </Box>
              );
            })}
            
            {/* Кнопка створення сервера */}
            <Tooltip title={t('addServer')} placement="right">
              <IconButton
                onClick={() => setCreateServerOpen(true)}
                sx={(theme) => ({
                  width: 48,
                  height: 48,
                  border: '2px dashed',
                  borderColor: theme.palette.primary.main,
                  borderRadius: '50%',
                  color: theme.palette.primary.main,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderRadius: '35%',
                    borderStyle: 'solid',
                    bgcolor: theme.palette.primary.main,
                    color: '#ffffff',
                  },
                })}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Нижні кнопки */}
        <Tooltip title={t('notificationsLabel')} placement="right">
          <IconButton
            onClick={() => setShowNotifications(!showNotifications)}
            sx={(theme) => ({
              width: 48,
              height: 48,
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
            })}
          >
            <Badge variant="dot" color="error" invisible={unreadCount === 0}>
              <BrutalBellIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title={t('settingsLabel')} placement="right">
          <IconButton
            onClick={() => setSettingsOpen(true)}
            sx={(theme) => ({
              width: 48,
              height: 48,
              color: theme.palette.text.secondary,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
              },
            })}
          >
            <BrutalSettingsIcon />
          </IconButton>
        </Tooltip>

        {/* Аватар користувача */}
        <Tooltip 
          title={
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {currentUser?.displayName || 'Мій профіль'}
              </Typography>
              {currentUser?.customStatus && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  {currentUser.customStatus}
                </Typography>
              )}
            </Box>
          } 
          placement="right"
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              onClick={() => setProfileOpen(true)}
              src={currentUser?.avatar}
              sx={(theme) => ({
                width: 48,
                height: 48,
                cursor: 'pointer',
                borderRadius: '50%',
                bgcolor: theme.palette.secondary.main,
                color: '#ffffff',
                fontWeight: 600,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderRadius: '35%',
                  bgcolor: theme.palette.secondary.dark,
                },
              })}
            >
              {currentUser?.displayName?.[0] || 'ME'}
            </Avatar>
            {/* Індикатор статусу */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? '#202225' : '#f2f3f5',
                bgcolor: currentUser?.status === 'online' ? '#3ba55d' 
                  : currentUser?.status === 'idle' ? '#faa81a'
                  : currentUser?.status === 'dnd' ? '#ed4245'
                  : currentUser?.status === 'invisible' ? '#747f8d'
                  : '#747f8d',
              }}
            />
          </Box>
        </Tooltip>
      </Box>

      {/* Діалог профілю */}
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Діалог налаштувань */}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Панель сповіщень */}
      <NotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Діалог створення сервера */}
      <CreateServerDialog 
        open={createServerOpen} 
        onClose={() => setCreateServerOpen(false)} 
        onCreate={handleCreateServer}
        onJoin={handleJoinServer}
      />
    </>
  );
};

export default Sidebar;
