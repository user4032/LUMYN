import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ClearAll as ClearIcon,
} from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { format } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import { searchMessages } from '@/renderer/api/social';

interface MessageSearchDialogProps {
  open: boolean;
  onClose: () => void;
  chatId: string | null;
  onSelectMessage?: (messageId: string) => void;
}

const MessageSearchDialog: React.FC<MessageSearchDialogProps> = ({
  open,
  onClose,
  chatId,
  onSelectMessage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const language = useSelector((state: RootState) => state.ui.language);
  
  const token = localStorage.getItem('disgram_auth_token');

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim() || !token) {
      setSearchResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const response = await searchMessages(token, query, chatId || undefined, 30, 0);
      if (response.ok) {
        setSearchResults(response.messages);
        setTotal(response.total);
      }
    } catch (error) {
      console.error('Failed to search messages:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const locale = language === 'uk' ? uk : enUS;

  return (
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
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <SearchIcon fontSize="small" />
            <span>{t('searchMessages')}</span>
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder={t('searchPlaceholder') || 'Search messages...'}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => handleSearch('')}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : searchQuery.trim() === '' ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('typeToSearch') || 'Start typing to search'}
            </Typography>
          </Box>
        ) : searchResults.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('noSearchResults')} "{searchQuery}"
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {t('resultsFound')}: {searchResults.length} / {total}
            </Typography>
            <List sx={{ width: '100%' }}>
              {searchResults.map((message) => (
                <ListItem
                  key={message.id}
                  onClick={() => onSelectMessage && onSelectMessage(message.id)}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    mb: 1,
                    p: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    cursor: onSelectMessage ? 'pointer' : 'default',
                    '&:hover': onSelectMessage ? { bgcolor: 'action.selected' } : {},
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                    <Avatar
                      src={message.senderAvatar}
                      sx={{ width: 32, height: 32, mr: 1 }}
                    >
                      {message.senderDisplayName?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {message.senderDisplayName || message.senderUsername}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(message.createdAt), 'PPp', { locale })}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      width: '100%',
                      ml: 5,
                    }}
                  >
                    {message.content}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MessageSearchDialog;
