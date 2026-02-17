import React, { useState } from 'react';
import { Box, Popover, Grid } from '@mui/material';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

// Популярні емодзі в Telegram
const EMOJI_CATEGORIES = {
  recent: ['😂', '❤️', '👍', '🔥', '😮', '😢', '👏', '🎉'],
  smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😌', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤮', '🤧', '🤬', '🤡', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦉', '🦅'],
  food: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🥓', '🥔', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🍰', '🎂', '🧁', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🍯', '🥛', '🍼', '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃'],
  activity: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎳', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '⛸️', '🎣', '🎽', '🎿', '⛷️', '🏂', '🪂', '🛷', '🥌', '🎯', '🪀', '🪃', '🎪', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪔', '🎻', '🎲', '🧩', '♠️', '♥️', '♦️', '♣️', '🎭', '🎰', '🎮'],
  travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🏎️', '🛵', '🦯', '🦽', '🦼', '🛺', '🚲', '🛴', '🛹', '🛼', '🚏', '⛽', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '�2', '🚝', '🚄', '🚅', '🚈', '🚞', '🚋', '🚃', '🚌', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🚲', '🛴', '🛵', '🏍️', '🏎️', '⛵', '🛶', '🚤', '🛳️', '⛴️', '🛥️', '🛰️', '🚁', '🛩️', '✈️', '🛫', '🛬'],
  objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎬', '📺', '📷', '📸', '📹', '🎞️', '🎦', '📽️', '🎭', '🎨', '🧩', '📖', '📕', '📗', '📘', '📙', '📚', '📓', '📔', '📒', '📑', '🧷', '🧷', '🧴', '🧷', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📡', '🕯️', '💡', '🔦', '🏮', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📏', '📐', '📍', '📌', '📎', '🖇️', '📐', '📒', '🧾', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🧷', '🧷', '🧴'],
  symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🤜', '🤛', '🦶', '🦵', '🦾', '🦿', '💪'],
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, anchorEl, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('recent');

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      disableRestoreFocus
      disableAutoFocus
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <Box sx={{ p: 2, width: 320 }}>
        {/* Категорії */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mb: 2,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: '4px',
            },
            '&::-webkit-scrollbar-track': {
              bg: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bg: 'divider',
              borderRadius: '2px',
            },
          }}
        >
          {Object.keys(EMOJI_CATEGORIES).map((cat) => (
            <Box
              key={cat}
              onClick={() => setSelectedCategory(cat as keyof typeof EMOJI_CATEGORIES)}
              sx={{
                px: 1,
                py: 0.5,
                cursor: 'pointer',
                borderRadius: 1,
                bgcolor: selectedCategory === cat ? 'primary.main' : 'transparent',
                color: selectedCategory === cat ? 'white' : 'text.primary',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: selectedCategory === cat ? 'primary.dark' : 'action.hover',
                },
                whiteSpace: 'nowrap',
              }}
            >
              {cat === 'recent' && '⏰'}
              {cat === 'smileys' && '😊'}
              {cat === 'animals' && '🐶'}
              {cat === 'food' && '🍔'}
              {cat === 'activity' && '⚽'}
              {cat === 'travel' && '🚗'}
              {cat === 'objects' && '💡'}
              {cat === 'symbols' && '❤️'}
            </Box>
          ))}
        </Box>

        {/* Емодзі сітка */}
        <Grid
          container
          spacing={0.75}
          sx={{
            maxHeight: 280,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              bg: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bg: 'divider',
              borderRadius: '3px',
            },
          }}
        >
          {EMOJI_CATEGORIES[selectedCategory].map((emoji, idx) => (
            <Grid item xs={3} key={idx} sx={{ minWidth: 'auto' }}>
              <Box
                onClick={() => {
                  onEmojiSelect(emoji);
                  onClose();
                }}
                sx={{
                  p: 1.25,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 1.5,
                  fontSize: '1.6rem',
                  transition: 'all 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(88, 101, 242, 0.15)' : 'rgba(88, 101, 242, 0.08)',
                    transform: 'scale(1.15)',
                  },
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
              >
                {emoji}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Popover>
  );
};

export default EmojiPicker;
