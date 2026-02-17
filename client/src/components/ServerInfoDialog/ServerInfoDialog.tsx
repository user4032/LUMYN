import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  TrendingUp as TrendingIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Celebration as CelebrationIcon,
  LocalFireDepartment as FireIcon,
  RocketLaunch as RocketIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import { formatDistanceToNow } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';

interface ServerInfoDialogProps {
  open: boolean;
  onClose: () => void;
  serverId: string;
}

const ServerInfoDialog: React.FC<ServerInfoDialogProps> = ({ open, onClose, serverId }) => {
  const server = useSelector((state: RootState) => 
    state.servers.servers.find(s => s.id === serverId)
  );
  const language = useSelector((state: RootState) => state.ui.language);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  if (!server) return null;

  const isOwner = server.ownerId === currentUser?.id;
  const memberCount = server.members?.length || 0;
  const textChannels = server.channels.filter(ch => ch.type === 'text').length;
  const voiceChannels = server.channels.filter(ch => ch.type === 'voice').length;
  
  // Симулюємо деякі статистики (в реальності вони б йшли з бекенду)
  const boostLevel = memberCount > 50 ? 3 : memberCount > 20 ? 2 : memberCount > 5 ? 1 : 0;
  const nextBoostLevel = boostLevel + 1;
  const boostsNeeded = [5, 20, 50];
  const currentBoosts = memberCount; // В реальності це було б окреме поле
  const boostsToNext = boostsNeeded[boostLevel] || 100;
  const boostProgress = (currentBoosts / boostsToNext) * 100;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'primary.main',
              fontSize: '1.5rem',
              fontWeight: 600,
            }}
          >
            {server.icon || server.name[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" fontWeight={600}>
                {server.name}
              </Typography>
              {boostLevel > 0 && (
                <Chip
                  icon={<StarIcon />}
                  label={`Level ${boostLevel}`}
                  size="small"
                  color="secondary"
                  sx={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                  }}
                />
              )}
            </Box>
            {server.description && (
              <Typography variant="body2" color="text.secondary">
                {server.description}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Статистика */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              {t('serverStats')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'action.hover' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight={600}>
                      {memberCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('totalMembers')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'action.hover' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight={600}>
                      {textChannels}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('textChannels')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'action.hover' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight={600}>
                      {voiceChannels}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('voiceChannels')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'action.hover' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <FireIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" fontWeight={600}>
                      {boostLevel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('boostLevel')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Server Boost Progress */}
          <Grid item xs={12}>
            <Typography
              variant="h6"
              fontWeight={600}
              mb={2}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <RocketIcon fontSize="small" />
              <span>{t('serverBoost')}</span>
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('currentLevel')}: {boostLevel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentBoosts} / {boostsToNext} {t('members')}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(boostProgress, 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {boostLevel < 3 
                  ? `${boostsToNext - currentBoosts} ${t('membersToNextLevel')}`
                  : t('maxLevelReached')
                }
              </Typography>
            </Box>

            {boostLevel >= 1 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600} mb={1}>
                  {t('unlockedPerks')}:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip
                    icon={<TrophyIcon />}
                    label={t('perk1')}
                    size="small"
                    color="primary"
                  />
                  {boostLevel >= 2 && (
                    <Chip
                      icon={<TrophyIcon />}
                      label={t('perk2')}
                      size="small"
                      color="secondary"
                    />
                  )}
                  {boostLevel >= 3 && (
                    <Chip
                      icon={<CelebrationIcon />}
                      label={t('perk3')}
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Додаткова інформація */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight={600} mb={2}>
              {t('additionalInfo')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('serverOwner')}:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {isOwner ? t('you') : t('unknown')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inviteCode')}:
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                  {server.inviteCode}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('totalChannels')}:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {server.channels.length}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServerInfoDialog;
