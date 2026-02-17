import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import {
  Tag as TextIcon,
  VolumeUp as VoiceIcon,
  Group as MembersIcon,
  EmojiEvents as TrophyIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';

interface ServerWelcomeDialogProps {
  open: boolean;
  onClose: () => void;
  server: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    members: string[];
    channels: any[];
  };
}

const ServerWelcomeDialog: React.FC<ServerWelcomeDialogProps> = ({ open, onClose, server }) => {
  const language = useSelector((state: RootState) => state.ui.language);

  const textChannels = server.channels.filter(ch => ch.type === 'text').length;
  const voiceChannels = server.channels.filter(ch => ch.type === 'voice').length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 4,
          textAlign: 'center',
          color: 'white',
        }}
      >
        <Avatar
          sx={{
            width: 100,
            height: 100,
            mx: 'auto',
            mb: 2,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            fontSize: '2.5rem',
            fontWeight: 600,
            border: '4px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          {server.icon || server.name[0]?.toUpperCase()}
        </Avatar>
        
        <Typography
          variant="h4"
          fontWeight={700}
          mb={1}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
        >
          <CelebrationIcon sx={{ fontSize: 28 }} />
          <span>{t('welcomeTo')} {server.name}!</span>
        </Typography>
        
        {server.description && (
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 400, mx: 'auto' }}>
            {server.description}
          </Typography>
        )}
      </Box>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600} mb={2}>
              {t('serverFeatures')}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TextIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {textChannels} {t('textChannels')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('textChannelsDesc')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'success.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VoiceIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {voiceChannels} {t('voiceChannels')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('voiceChannelsDesc')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MembersIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {server.members.length} {t('activeMembers')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('activeMembersDesc')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="h6" fontWeight={600} mb={2}>
              {t('communityGuidelines')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip
                icon={<TrophyIcon />}
                label={t('beRespectful')}
                sx={{ justifyContent: 'flex-start' }}
              />
              <Chip
                icon={<TrophyIcon />}
                label={t('noSpam')}
                sx={{ justifyContent: 'flex-start' }}
              />
              <Chip
                icon={<TrophyIcon />}
                label={t('haveFun')}
                sx={{ justifyContent: 'flex-start' }}
              />
            </Box>
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={onClose}
            sx={{
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
              },
            }}
          >
            {t('letsGo')}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ServerWelcomeDialog;
