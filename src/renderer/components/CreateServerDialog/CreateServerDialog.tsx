import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Avatar,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { Folder as TemplateIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import ServerTemplatesDialog from '../ServerTemplatesDialog/ServerTemplatesDialog';

interface ServerChannel {
  id?: string;
  name: string;
  type: 'text' | 'voice';
  category?: string;
  unreadCount?: number;
}

interface ServerTemplate {
  banner?: string;
}

interface CreateServerDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, channels?: ServerChannel[], banner?: string) => void;
  onJoin?: (code: string) => void;
}

const CreateServerDialog: React.FC<CreateServerDialogProps> = ({ open, onClose, onCreate, onJoin }) => {
  const [serverName, setServerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [tab, setTab] = useState(0);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const language = useSelector((state: RootState) => state.ui.language);

  const handleCreate = () => {
    if (!serverName.trim()) return;

    onCreate(serverName);
    setServerName('');
    onClose();
  };

  const handleJoin = () => {
    if (!inviteCode.trim()) return;
    if (onJoin) {
      onJoin(inviteCode);
      setInviteCode('');
    }
  };

  const handleClose = () => {
    setServerName('');
    setInviteCode('');
    setTab(0);
    onClose();
  };

  const handleTemplateCreate = (name: string, template: any) => {
    const channels: ServerChannel[] = template.channels.map((ch: any, index: number) => ({
      id: `ch_${Date.now()}_${index}`,
      name: ch.name,
      type: ch.type,
      category: ch.category,
      unreadCount: 0,
    }));
    onCreate(name, channels, template.banner);
    setTemplatesOpen(false);
    handleClose();
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
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab label={t('createServer')} />
          <Tab label={t('joinServer')} />
        </Tabs>
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        {tab === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2.5rem',
                borderRadius: 3,
              }}
            >
              {serverName[0]?.toUpperCase() || '🏠'}
            </Avatar>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              {t('serverName')}
            </Typography>
            <TextField
              fullWidth
              placeholder={t('serverNamePlaceholder')}
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && serverName.trim()) {
                  handleCreate();
                }
              }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
              {t('serverRenameHint')}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 2,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              💡 {t('serverAutoChannels')}
            </Typography>
          </Box>

          <Divider>
            <Typography variant="caption" color="text.secondary">
              {t('or')}
            </Typography>
          </Divider>

          <Button
            variant="outlined"
            startIcon={<TemplateIcon />}
            onClick={() => setTemplatesOpen(true)}
            sx={{ py: 1.5 }}
          >
            {t('useTemplate')}
          </Button>
        </Box>
        ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'success.main',
                fontSize: '2.5rem',
                borderRadius: 3,
              }}
            >
              🔗
            </Avatar>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              {t('inviteCode')}
            </Typography>
            <TextField
              fullWidth
              placeholder="ABC123XYZ"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && inviteCode.trim()) {
                  handleJoin();
                }
              }}
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
              {t('enterInviteCode')}
            </Typography>
          </Box>
        </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={handleClose} color="inherit">
          {t('cancel')}
        </Button>
        {tab === 0 ? (
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!serverName.trim()}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          {t('createServer')}
        </Button>
        ) : (
        <Button
          onClick={handleJoin}
          variant="contained"
          disabled={!inviteCode.trim()}
          sx={{
            bgcolor: 'success.main',
            '&:hover': {
              bgcolor: 'success.dark',
            },
          }}
        >
          {t('join')}
        </Button>
        )}
      </DialogActions>

      <ServerTemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onCreate={handleTemplateCreate}
      />
    </Dialog>
  );
};

export default CreateServerDialog;
