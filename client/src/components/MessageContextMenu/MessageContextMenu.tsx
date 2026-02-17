import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Reply as ReplyIcon,
  EmojiEmotions as ReactionIcon,
  Timer as TimerIcon,
  FileCopy as CopyIcon,
  Forward as ForwardIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { t } from '../../i18n';

interface MessageContextMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  messageId: string;
  onDelete: () => void;
  onEdit: () => void;
  onReply: () => void;
  onReact: () => void;
  onForward: () => void;
  onCopy: () => void;
  onSetDisappearing: (seconds: number) => void;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  anchorEl,
  open,
  onClose,
  messageId,
  onDelete,
  onEdit,
  onReply,
  onReact,
  onForward,
  onCopy,
  onSetDisappearing,
}) => {
  const [disappearingOpen, setDisappearingOpen] = useState(false);
  const [disappearingTime, setDisappearingTime] = useState('86400'); // 24 hours default

  const handleDisappearing = () => {
    onSetDisappearing(parseInt(disappearingTime));
    setDisappearingOpen(false);
    onClose();
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { minWidth: 250 },
        }}
      >
        <MenuItem
          onClick={() => {
            onCopy();
            onClose();
          }}
        >
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('copy')}</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            onReply();
            onClose();
          }}
        >
          <ListItemIcon>
            <ReplyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('reply')}</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            onReact();
            onClose();
          }}
        >
          <ListItemIcon>
            <ReactionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('react')}</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            onForward();
            onClose();
          }}
        >
          <ListItemIcon>
            <ForwardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('forward')}</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => {
            setDisappearingOpen(true);
          }}
        >
          <ListItemIcon>
            <TimerIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('disappearing')}</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            onEdit();
            onClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('edit')}</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem
          onClick={() => {
            onDelete();
            onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('delete')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Disappearing Message Dialog */}
      <Dialog open={disappearingOpen} onClose={() => setDisappearingOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('disappearing')}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{t('expireAfter')}</InputLabel>
            <Select
              value={disappearingTime}
              onChange={(e) => setDisappearingTime(e.target.value)}
              label="Expire After"
            >
              <option value="3600">1 час</option>
              <option value="86400">24 години</option>
              <option value="259200">3 дні</option>
              <option value="604800">7 днів</option>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisappearingOpen(false)}>{t('cancel')}</Button>
          <Button onClick={handleDisappearing} variant="contained">
            {t('set')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
