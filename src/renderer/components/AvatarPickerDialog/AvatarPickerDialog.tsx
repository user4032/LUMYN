import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Avatar,
  IconButton,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';

interface AvatarPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
}

// Набір дефолтних аватарок - тільки emoji стиль
const DEFAULT_AVATARS = [
  // Thumbs - великі пальці
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Like&backgroundColor=ff6b35',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Cool&backgroundColor=4ecdc4',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Nice&backgroundColor=f7b731',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Great&backgroundColor=5f27cd',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Awesome&backgroundColor=00d2d3',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Super&backgroundColor=ff9ff3',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Perfect&backgroundColor=54a0ff',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Best&backgroundColor=48dbfb',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Top&backgroundColor=ff6348',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Star&backgroundColor=ffa502',
];

const AvatarPickerDialog: React.FC<AvatarPickerDialogProps> = ({ open, onClose, onSelect }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleSelect = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      setSelectedAvatar(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedAvatar(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {t('chooseAvatar')}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {DEFAULT_AVATARS.map((avatarUrl, index) => (
            <Grid item xs={6} sm={3} md={2} key={index}>
              <Avatar
                src={avatarUrl}
                sx={{
                  width: 80,
                  height: 80,
                  cursor: 'pointer',
                  border: selectedAvatar === avatarUrl ? '3px solid' : '2px solid transparent',
                  borderColor: selectedAvatar === avatarUrl ? 'primary.main' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => setSelectedAvatar(avatarUrl)}
              />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={handleClose} color="inherit">
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleSelect} 
            variant="contained" 
            disabled={!selectedAvatar}
          >
              {t('selectButton')}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarPickerDialog;
