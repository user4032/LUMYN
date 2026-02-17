import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';

interface JoinServerDialogProps {
  open: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
}

const JoinServerDialog: React.FC<JoinServerDialogProps> = ({ open, onClose, onJoin }) => {
  const language = useSelector((state: RootState) => state.ui.language);
  const [code, setCode] = React.useState('');

  const handleJoin = () => {
    if (!code.trim()) return;
    onJoin(code.trim());
    setCode('');
    onClose();
  };

  const handleClose = () => {
    setCode('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        {t('joinServer')}
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('inviteCode')}
          </Typography>
          <TextField
            fullWidth
            placeholder={t('inviteCode')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={handleClose} color="inherit">
          {t('cancel')}
        </Button>
        <Button
          onClick={handleJoin}
          variant="contained"
          disabled={!code.trim()}
        >
          {t('join')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JoinServerDialog;
