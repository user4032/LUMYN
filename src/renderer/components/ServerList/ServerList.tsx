import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Avatar,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandIcon,
  Tag as TextChannelIcon,
  VolumeUp as VoiceChannelIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { RootState } from '@store/store';
import { setActiveServer, setActiveChannel, addServer } from '@store/slices/serversSlice';
import CreateServerDialog from '../CreateServerDialog/CreateServerDialog';
import JoinServerDialog from '../JoinServerDialog/JoinServerDialog';
import ServerSettingsDialog from '../ServerSettingsDialog/ServerSettingsDialog';
import { t } from '@i18n/index';
import { createServer, joinServer } from '@/renderer/api/social';

interface ServerListProps {
  onSelectServer: (serverId: string) => void;
  selectedServer: string | null;
}

const ServerList: React.FC<ServerListProps> = ({ onSelectServer, selectedServer }) => {
  const dispatch = useDispatch();
  const servers = useSelector((state: RootState) => state.servers.servers);
  const activeServer = useSelector((state: RootState) => state.servers.activeServer);
  const activeChannel = useSelector((state: RootState) => state.servers.activeChannel);
  const language = useSelector((state: RootState) => state.ui.language);
  
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([
    'Текстові',
    'Голосові',
    'Text',
    'Voice',
  ]);
  const [createServerOpen, setCreateServerOpen] = React.useState(false);
  const [joinServerOpen, setJoinServerOpen] = React.useState(false);
  const [serverSettingsOpen, setServerSettingsOpen] = React.useState(false);

  const currentServer = servers.find((s) => s.id === activeServer);

  // Автоматично вибираємо перший сервер при завантаженні
  React.useEffect(() => {
    if (!activeServer && servers.length > 0) {
      const firstServer = servers[0];
      dispatch(setActiveServer(firstServer.id));
      onSelectServer(firstServer.id);
      
      // Вибираємо перший текстовий канал
      const firstTextChannel = firstServer.channels.find(ch => ch.type === 'text');
      if (firstTextChannel) {
        dispatch(setActiveChannel(firstTextChannel.id));
      }
    }
  }, [activeServer, servers, dispatch, onSelectServer]);

  const handleSelectServer = (serverId: string) => {
    dispatch(setActiveServer(serverId));
    onSelectServer(serverId);
    
    // Автоматично вибираємо перший текстовий канал
    const server = servers.find(s => s.id === serverId);
    if (server) {
      const firstTextChannel = server.channels.find(ch => ch.type === 'text');
      if (firstTextChannel) {
        dispatch(setActiveChannel(firstTextChannel.id));
      }
    }
  };

  const handleSelectChannel = (channelId: string) => {
    dispatch(setActiveChannel(channelId));
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const groupChannelsByCategory = () => {
    if (!currentServer) return {};
    
    return currentServer.channels.reduce((acc, channel) => {
      const category = channel.category || 'Без категорії';
      if (!acc[category]) acc[category] = [];
      acc[category].push(channel);
      return acc;
    }, {} as Record<string, typeof currentServer.channels>);
  };

  const getCategoryLabel = (category: string) => {
    if (category === 'Текстові' || category.toLowerCase() === 'text') {
      return t('textCategory');
    }
    if (category === 'Голосові' || category.toLowerCase() === 'voice') {
      return t('voiceCategory');
    }
    if (category === 'Без категорії' || category.toLowerCase() === 'no category') {
      return t('noCategory');
    }
    return category;
  };

  const handleBackToServerList = () => {
    dispatch(setActiveServer(null));
    dispatch(setActiveChannel(null));
  };

  const handleCreateServer = async (name: string) => {
    const token = localStorage.getItem('disgram_auth_token');
    if (!token) {
      alert('Ви не авторизовані');
      return;
    }

    try {
      const response = await createServer(token, name, [
        {
          id: `c${Date.now()}`,
          serverId: 'temp',
          name: t('defaultTextChannel'),
          type: 'text',
          category: t('textCategory'),
          unreadCount: 0,
        },
        {
          id: `c${Date.now() + 1}`,
          serverId: 'temp',
          name: t('defaultVoiceChannel'),
          type: 'voice',
          category: t('voiceCategory'),
          unreadCount: 0,
        },
      ]);

      if (response.server) {
        const created = {
          ...response.server,
          channels: response.server.channels.map((ch: any) => ({
            ...ch,
            serverId: response.server.id,
          })),
        };
        dispatch(addServer(created));
        setCreateServerOpen(false);
        alert(`${t('inviteCode')}: ${response.server.inviteCode}`);
      } else if (response.error) {
        alert(`Помилка: ${response.error}`);
      }
    } catch (err) {
      console.error('Failed to create server:', err);
      const errorMessage = err instanceof Error ? err.message : 'Невідома помилка';
      alert(`Не вдалось створити сервер: ${errorMessage}\n\nПеревірте чи запущений сервер (npm run server)`);
    }
  };

  const handleJoinServer = async (code: string) => {
    const token = localStorage.getItem('disgram_auth_token');
    if (!token) return;

    try {
      const response = await joinServer(token, code);
      if (response.server) {
        const joined = {
          ...response.server,
          channels: response.server.channels.map((ch: any) => ({
            ...ch,
            serverId: response.server.id,
          })),
        };
        dispatch(addServer(joined));
      }
    } catch (err) {
      console.error('Failed to join server:', err);
      alert('Failed to join server');
    }
  };

  if (!activeServer || !currentServer) {
    return (
      <Box
        sx={{
          width: 320,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
            {t('serversLabel')}
          </Typography>
        </Box>

        <List sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {servers.map((server) => (
            <ListItem key={server.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleSelectServer(server.id)}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: 'primary.main',
                    mr: 2,
                    borderRadius: 2,
                  }}
                >
                  {server.name[0]}
                </Avatar>
                <ListItemText
                  primary={server.name}
                  secondary={`${server.channels.length} ${t('channels')}`}
                  primaryTypographyProps={{
                    sx: { color: 'text.primary', fontWeight: 600 },
                  }}
                  secondaryTypographyProps={{
                    sx: { color: 'text.secondary' },
                  }}
                />
                {server.unreadCount > 0 && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <CreateServerDialog
          open={createServerOpen}
          onClose={() => setCreateServerOpen(false)}
          onCreate={handleCreateServer}
        />

        <JoinServerDialog
          open={joinServerOpen}
          onClose={() => setJoinServerOpen(false)}
          onJoin={handleJoinServer}
        />
      </Box>
    );
  }

  const groupedChannels = groupChannelsByCategory();

  return (
    <Box
      sx={{
        width: 320,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Банер сервера */}
      {currentServer.banner && (
        <Box
          sx={{
            height: 120,
            backgroundImage: `url(${currentServer.banner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
            },
          }}
        />
      )}

      {/* Заголовок сервера */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            '&:hover .back-text': { 
              textDecoration: 'underline'
            },
          }}
          onClick={handleBackToServerList}
        >
          <Typography 
            variant="h6" 
            sx={{ fontWeight: 600, color: 'text.primary' }}
            className="back-text"
          >
            {currentServer.name}
          </Typography>
        </Box>
        <IconButton
          onClick={() => setServerSettingsOpen(true)}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'text.primary' },
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>

      {/* Канали */}
      <List sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {Object.entries(groupedChannels).map(([category, channels]) => (
          <Box key={category}>
            <ListItem
              sx={{
                py: 0.5,
                px: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)' },
              }}
              onClick={() => toggleCategory(category)}
            >
              <IconButton size="small" sx={{ mr: 0.5, transform: expandedCategories.includes(category) ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '0.2s' }}>
                <ExpandIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                {getCategoryLabel(category)}
              </Typography>
            </ListItem>

            <Collapse in={expandedCategories.includes(category)}>
              {channels.map((channel) => (
                <ListItemButton
                  key={channel.id}
                  selected={activeChannel === channel.id}
                  onClick={() => handleSelectChannel(channel.id)}
                  sx={{
                    pl: 4,
                    py: 0.75,
                    borderRadius: 1,
                    mx: 1,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(88, 101, 242, 0.15)',
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  {channel.type === 'text' ? (
                    <TextChannelIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
                  ) : (
                    <VoiceChannelIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
                  )}
                  <ListItemText
                    primary={channel.name}
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: activeChannel === channel.id ? 600 : 400,
                      sx: { color: 'text.primary' },
                    }}
                  />
                  {channel.unreadCount > 0 && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'error.main',
                      }}
                    />
                  )}
                </ListItemButton>
              ))}
            </Collapse>
          </Box>
        ))}
      </List>

      <CreateServerDialog
        open={createServerOpen}
        onClose={() => setCreateServerOpen(false)}
        onCreate={handleCreateServer}
      />

      <ServerSettingsDialog
        open={serverSettingsOpen}
        onClose={() => setServerSettingsOpen(false)}
        serverId={activeServer || ''}
      />
    </Box>
  );
};

export default ServerList;
