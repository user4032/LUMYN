import React, { useState } from 'react';
import {
  Box,
  Paper,
  Grid,
  IconButton,
  Popover,
  TextField,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import {
  EmojiEmotions as EmojiIcon,
  Favorite as HeartIcon,
  ThumbUp as ThumbsUpIcon,
  SentimentSatisfied as FunnyIcon,
} from '@mui/icons-material';

interface EmojiGroup {
  name: string;
  emojis: string[];
}

const emojiGroups: EmojiGroup[] = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😚', '😙', '🤑', '😎', '🤓', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😲', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😱', '😖', '😣', '😞', '😔', '😡', '😠', '🤬', '😈', '👿'],
  },
  {
    name: 'Gestures',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🤜', '🤛', '🦾', '🦿'],
  },
  {
    name: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '🩵', '🩶', '🩷', '🩸', '💔', '💞', '💓', '💕', '💖', '💗', '💘', '💝', '💟', '👋'],
  },
  {
    name: 'Objects',
    emojis: ['🎂', '🍰', '🎁', '🎀', '🎈', '🎉', '🎊', '🎇', '✨', '🌟', '⭐', '🎆', '🎑', '🏵️', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌙', '⭐', '✨'],
  },
];

interface EmojiReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

export const EmojiReactionPicker: React.FC<EmojiReactionPickerProps> = ({
  onSelectEmoji,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const currentEmojis =
    selectedTab < emojiGroups.length ? emojiGroups[selectedTab].emojis : [];

  const filteredEmojis = currentEmojis.filter((emoji) => {
    if (!searchQuery) return true;
    return emoji.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        title="Add reaction"
      >
        <EmojiIcon fontSize="small" />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Paper sx={{ width: 320, p: 2 }}>
          <TextField
            size="small"
            placeholder="Search emojis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={{ mb: 1 }}
          />

          <Tabs
            value={selectedTab}
            onChange={(_, val) => setSelectedTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 1 }}
          >
            {emojiGroups.map((group, idx) => (
              <Tab key={idx} label={group.name} />
            ))}
          </Tabs>

          <Grid container spacing={1}>
            {filteredEmojis.map((emoji, idx) => (
              <Grid item xs={3} key={idx}>
                <IconButton
                  size="small"
                  onClick={() => {
                    onSelectEmoji(emoji);
                    handleClose();
                  }}
                  sx={{
                    width: '100%',
                    fontSize: 24,
                    '&:hover': {
                      transform: 'scale(1.3)',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  {emoji}
                </IconButton>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Popover>
    </>
  );
};
