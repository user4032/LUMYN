import React from 'react';
import SettingsScreen from '../Settings/SettingsScreen';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface SettingsDialogV2Props {
  open: boolean;
  onClose: () => void;
}

const SettingsDialogV2: React.FC<SettingsDialogV2Props> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: (theme) => ({
          bgcolor: theme.palette.background.paper,
          borderRadius: 4,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px 0 rgba(0,0,0,0.45)'
            : '0 8px 32px 0 rgba(0,0,0,0.08)',
          border: `1.5px solid ${theme.palette.divider}`,
          position: 'relative',
        }),
      }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: 'absolute', right: 16, top: 16, zIndex: 10, color: 'text.secondary', transition: 'color 0.18s', '&:hover': { color: 'primary.main' } }}
      >
        <CloseIcon fontSize="medium" />
      </IconButton>
      <DialogContent sx={{ p: 0, minHeight: 600 }}>
        <SettingsScreen />
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialogV2;
