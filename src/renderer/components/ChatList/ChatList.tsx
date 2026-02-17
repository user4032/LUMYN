import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Grow,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  PushPin as PinIcon,
  VolumeOff as MuteIcon,
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Bookmark as BookmarkIcon,
  UnfoldMore as UnfoldMoreIcon,
} from '@mui/icons-material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import { RootState } from '@store/store';
import { markAsRead, deleteChat, toggleHideChat } from '@store/slices/chatsSlice';
import { formatDistanceToNow } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { t } from '@i18n/index';
import UserSearchDialog from '../UserSearchDialog/UserSearchDialog';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';

interface ChatListProps {
  selectedChat: string | null;
  onSelectChat: (chatId: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ selectedChat, onSelectChat }) => {
  const dispatch = useDispatch();
  const chats = useSelector((state: RootState) => state.chats.chats);
  const messagesByChat = useSelector((state: RootState) => state.chats.messages);
  const language = useSelector((state: RootState) => state.ui.language);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [friendsOpen, setFriendsOpen] = React.useState(false);
  const [showHiddenChats, setShowHiddenChats] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
    chatId: string;
  } | null>(null);

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'online': return '#3ba55d';
      case 'idle': return '#faa81a';
      case 'dnd': return '#ed4245';
      case 'away': return '#faa81a';
      case 'busy': return '#ed4245';
      case 'invisible':
      case 'offline': 
      default: return '#747f8d';
    }
  };

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isHidden = chat.isHidden;
    
    if (showHiddenChats) {
      return isHidden && matchesSearch;
    } else {
      return !isHidden && matchesSearch;
    }
  });

  const sortedChats = filteredChats
    .map((chat) => {
      const chatMessages = messagesByChat[chat.id] || [];
      const lastMessage = chatMessages[chatMessages.length - 1];
      return {
        chat,
        lastTimestamp: lastMessage?.timestamp || 0,
      };
    })
    .sort((a, b) => {
      const pinDiff = (b.chat.isPinned ? 1 : 0) - (a.chat.isPinned ? 1 : 0);
      if (pinDiff !== 0) return pinDiff;
      return b.lastTimestamp - a.lastTimestamp;
    });

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    dispatch(markAsRead(chatId));
  };

  const handleContextMenu = (event: React.MouseEvent, chatId: string) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
            chatId,
          }
        : null
    );
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handlePinChat = () => {
    if (contextMenu) {
      dispatch({ type: 'chats/togglePin', payload: contextMenu.chatId });
    }
    handleCloseContextMenu();
  };

  const handleMuteChat = () => {
    if (contextMenu) {
      dispatch({ type: 'chats/toggleMute', payload: contextMenu.chatId });
    }
    handleCloseContextMenu();
  };

  const handleHideChat = () => {
    if (contextMenu) {
      dispatch(toggleHideChat(contextMenu.chatId));
    }
    handleCloseContextMenu();
  };

  const handleDeleteChat = () => {
    setConfirmDelete(true);
  };

  const confirmDeleteChat = () => {
    if (contextMenu) {
      dispatch(deleteChat(contextMenu.chatId));
      if (selectedChat === contextMenu.chatId) {
        onSelectChat('');
      }
    }
    setConfirmDelete(false);
    handleCloseContextMenu();
  };

  const cancelDeleteChat = () => {
    setConfirmDelete(false);
  };

  const getTimeAgo = (timestamp: number) => {
    const locale = language === 'en' ? enUS : uk;
    return formatDistanceToNow(timestamp, { addSuffix: true, locale });
  };

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
      {/* Заголовок */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {showHiddenChats ? t('hiddenChats') : t('chats')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title={showHiddenChats ? t('showChats') : t('showHiddenChats')}>
              <IconButton 
                size="small" 
                onClick={() => setShowHiddenChats(!showHiddenChats)}
                color={showHiddenChats ? 'primary' : 'inherit'}
                sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    bgcolor: 'action.hover',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
              >
                {showHiddenChats ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <IconButton 
              size="small" 
              onClick={() => setFriendsOpen(true)}
              sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  bgcolor: 'action.hover',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <PersonAddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        
        {/* Пошук */}
        <TextField
          fullWidth
          size="small"
          placeholder={t('searchChats')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'background.default',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
              },
              '&.Mui-focused': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            },
          }}
        />
      </Box>

      {/* Список чатів */}
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {sortedChats.map(({ chat }, index) => {
          const chatMessages = messagesByChat[chat.id] || [];
          const lastMessage = chatMessages[chatMessages.length - 1];
          return (
          <Grow 
            in 
            timeout={300 + index * 50} 
            key={chat.id}
            style={{ transformOrigin: '0 0 0' }}
          >
          <ListItem
            disablePadding
            secondaryAction={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {chat.isPinned && <PinIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                {chat.isMuted && <MuteIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
              </Box>
            }
          >
            <ListItemButton
              selected={selectedChat === chat.id}
              onClick={() => handleSelectChat(chat.id)}
              onContextMenu={(e) => handleContextMenu(e, chat.id)}
              sx={{
                px: 2,
                py: 1.5,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-selected': {
                  bgcolor: 'rgba(88, 101, 242, 0.1)',
                  borderLeft: '3px solid',
                  borderColor: 'primary.main',
                  transform: 'translateX(0px)',
                },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  transform: 'translateX(4px)',
                },
                '&:active': {
                  transform: 'scale(0.98)',
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: getStatusColor(chat.status),
                      boxShadow: '0 0 0 2px #2b2d31',
                    },
                  }}
                >
                  <Avatar
                    src={chat.id === currentUser?.id ? currentUser?.avatar : chat.avatar}
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: chat.type === 'saved' ? 'warning.main' : (chat.type === 'channel' ? 'secondary.main' : 'primary.main'),
                      color: '#ffffff',
                    }}
                  >
                    {chat.type === 'saved' ? <BookmarkIcon /> : chat.name[0].toUpperCase()}
                  </Avatar>
                </Badge>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography component="span" variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {chat.type === 'saved' ? t('savedMessages') : chat.name}
                    </Typography>
                    {lastMessage && (
                      <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                        {getTimeAgo(lastMessage.timestamp)}
                      </Typography>
                    )}
                  </Box>
                }
                secondary={
                  <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '180px',
                      }}
                    >
                      {lastMessage
                        ? (lastMessage.content?.trim()
                          ? lastMessage.content
                          : (lastMessage.attachments && lastMessage.attachments.length > 0)
                            ? t('photo')
                            : t('typeMessage'))
                        : t('typeMessage')}
                    </Typography>
                    {chat.unreadCount > 0 && (
                      <Box
                        component="span"
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: 'error.main',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
          </Grow>
        );
        })}
      </List>

      {filteredChats.length === 0 && searchQuery.trim().length === 0 && (
        <Box sx={{ p: 2, color: 'text.secondary' }}>
          <Typography variant="body2">{t('noChats')}</Typography>
          <Typography variant="caption">{t('noChatsHint')}</Typography>
        </Box>
      )}

      <UserSearchDialog 
        open={friendsOpen} 
        onClose={() => setFriendsOpen(false)}
        onUserSelect={(userId) => {
          setFriendsOpen(false);
          onSelectChat(userId);
        }}
      />

      {/* Контекстне меню */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        disableRestoreFocus
        disableAutoFocus
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={handlePinChat}>
          <ListItemIcon>
            <PinIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">
            {contextMenu && chats.find((chat) => chat.id === contextMenu.chatId)?.isPinned
              ? t('unpinChat')
              : t('pinChat')}
          </Typography>
        </MenuItem>
        
        <MenuItem onClick={handleMuteChat}>
          <ListItemIcon>
            <MuteIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">{t('muteChat')}</Typography>
        </MenuItem>
        
        <MenuItem onClick={handleHideChat}>
          <ListItemIcon>
            <VisibilityOffIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">{t('hideChat')}</Typography>
        </MenuItem>
        
        {contextMenu && contextMenu.chatId !== 'saved_messages' && (
          <>
            <Divider />
            
            <MenuItem onClick={handleDeleteChat} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <Typography variant="body2">{t('deleteChat')}</Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      <ConfirmDialog
        open={confirmDelete}
        title={t('deleteChat')}
        message={t('deleteChatConfirm')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        onConfirm={confirmDeleteChat}
        onCancel={cancelDeleteChat}
        confirmColor="error"
      />
    </Box>
  );
};

export default ChatList;
