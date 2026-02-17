import React, { useState } from 'react';
import { Box, IconButton, Popover, Typography, Tooltip } from '@mui/material';
import { AddReaction as AddReactionIcon } from '@mui/icons-material';

interface Reaction {
  emoji: string;
  users: string[];
}

interface MessageReactionsProps {
  reactions: Reaction[];
  currentUserId: string;
  onReact: (emoji: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎉', '🔥'];

const MessageReactions: React.FC<MessageReactionsProps> = ({ reactions, currentUserId, onReact }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOpenPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePicker = () => {
    setAnchorEl(null);
  };

  const handleReact = (emoji: string) => {
    onReact(emoji);
    handleClosePicker();
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
      {reactions.map((reaction) => {
        const hasReacted = reaction.users.includes(currentUserId);
        return (
          <Tooltip
            key={reaction.emoji}
            title={`${reaction.users.length} ${reaction.users.length === 1 ? 'користувач' : 'користувачів'}`}
          >
            <Box
              onClick={() => onReact(reaction.emoji)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: 3,
                bgcolor: hasReacted ? 'primary.main' : 'action.hover',
                border: '1px solid',
                borderColor: hasReacted ? 'primary.dark' : 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: hasReacted ? 'primary.dark' : 'action.selected',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Typography sx={{ fontSize: '14px' }}>{reaction.emoji}</Typography>
              <Typography
                sx={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: hasReacted ? 'primary.contrastText' : 'text.secondary',
                }}
              >
                {reaction.users.length}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}

      <Tooltip title="Додати реакцію">
        <IconButton
          size="small"
          onClick={handleOpenPicker}
          sx={{
            width: 24,
            height: 24,
            opacity: 0.6,
            '&:hover': {
              opacity: 1,
              bgcolor: 'action.hover',
            },
          }}
        >
          <AddReactionIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePicker}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 1, display: 'flex', gap: 0.5 }}>
          {QUICK_REACTIONS.map((emoji) => (
            <IconButton
              key={emoji}
              onClick={() => handleReact(emoji)}
              sx={{
                fontSize: '20px',
                width: 36,
                height: 36,
                '&:hover': {
                  transform: 'scale(1.2)',
                  bgcolor: 'action.hover',
                },
              }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Box>
  );
};

export default MessageReactions;
