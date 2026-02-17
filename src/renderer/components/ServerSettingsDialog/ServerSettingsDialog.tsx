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
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  ExitToApp as LeaveIcon,
  PhotoCamera as CameraIcon,
  EmojiEvents as AdminIcon,
  TextSnippet as TextChannelIcon,
  VolumeUp as VoiceChannelIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import { updateServer, deleteServer, leaveServer, createChannel, deleteChannel } from '@/renderer/api/social';
import { updateServer as updateServerRedux, removeServer } from '@store/slices/serversSlice';
import ServerRolesDialog from '../ServerRolesDialog/ServerRolesDialog';

interface ServerSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  serverId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const ServerSettingsDialog: React.FC<ServerSettingsDialogProps> = ({ open, onClose, serverId }) => {
  const dispatch = useDispatch();
  const [tab, setTab] = useState(0);
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [serverBanner, setServerBanner] = useState('');
  const [serverIcon, setServerIcon] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(false);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [customInviteCode, setCustomInviteCode] = useState('');
  const [editingCode, setEditingCode] = useState(false);
  const [codeCopyMessage, setCodeCopyMessage] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);
  
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const server = useSelector((state: RootState) => 
    state.servers.servers.find(s => s.id === serverId)
  );
  const language = useSelector((state: RootState) => state.ui.language);
  const sanitizeInviteCode = (value: string) =>
    String(value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  const getBannerPreviewStyles = (banner: string) => {
    const trimmed = String(banner || '').trim();
    if (!trimmed) return {};
    if (trimmed.includes('gradient(')) {
      return {
        background: trimmed,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      backgroundImage: `url(${trimmed})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  };

  React.useEffect(() => {
    if (server && open) {
      setServerName(server.name);
      setServerDescription(server.description || '');
      setServerBanner(server.banner || '');
      setServerIcon(server.icon || '');
      setCustomInviteCode(server.inviteCode || '');
      setEditingCode(false);
      setCodeCopyMessage('');
    }
  }, [server, open]);

  if (!server || !currentUser) return null;

  const isOwner = server.ownerId === currentUser.id;

  const handleUpdateServer = async () => {
    if (!currentUser.token) return;
    
    setLoading(true);
    try {
      const response = await updateServer(currentUser.token, serverId, {
        name: serverName,
        description: serverDescription,
        banner: serverBanner,
        icon: serverIcon,
      });
      
      if (response.ok && response.server) {
        dispatch(updateServerRedux(response.server));
        alert(t('serverUpdated'));
      }
    } catch (error) {
      console.error('Failed to update server:', error);
      alert(t('serverUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInviteCode = async () => {
    if (!currentUser.token || !isOwner) return;

    const normalizedInviteCode = sanitizeInviteCode(customInviteCode);
    if (normalizedInviteCode.length < 4) {
      alert(t('inviteCodeTooShort') || 'Invite code must be at least 4 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await updateServer(currentUser.token, serverId, {
        inviteCode: normalizedInviteCode,
      });

      if (response.ok && response.server) {
        dispatch(updateServerRedux(response.server));
        setCustomInviteCode(response.server.inviteCode || normalizedInviteCode);
        setEditingCode(false);
        alert(t('inviteCodeUpdated') || 'Invite code updated');
      }
    } catch (error) {
      console.error('Failed to update invite code:', error);
      alert(t('inviteCodeUpdateFailed') || 'Failed to update invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setServerIcon(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setServerBanner(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteServer = async () => {
    if (!currentUser.token) return;
    
    const confirmed = window.confirm(t('confirmDeleteServer'));
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await deleteServer(currentUser.token, serverId);
      if (response.ok) {
        dispatch(removeServer(serverId));
        onClose();
        alert(t('serverDeleted'));
      }
    } catch (error) {
      console.error('Failed to delete server:', error);
      alert(t('serverDeleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveServer = async () => {
    if (!currentUser.token) return;
    
    const confirmed = window.confirm(t('confirmLeaveServer'));
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await leaveServer(currentUser.token, serverId);
      if (response.ok) {
        dispatch(removeServer(serverId));
        onClose();
        alert(t('serverLeft'));
      }
    } catch (error) {
      console.error('Failed to leave server:', error);
      alert(t('serverLeaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    if (!currentUser.token || !newChannelName.trim()) return;

    setLoading(true);
    try {
      const response = await createChannel(currentUser.token, serverId, {
        name: newChannelName,
        type: channelType,
      });
      
      if (response.ok && response.channel) {
        // Оновлюємо сервер з новим каналом
        const updatedServer = {
          ...server,
          channels: [...(server.channels || []), response.channel],
        };
        dispatch(updateServerRedux(updatedServer));
        setNewChannelName('');
        alert(t('channelCreated'));
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
      alert(t('channelCreationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!currentUser.token) return;
    
    const confirmed = window.confirm(t('confirmDeleteChannel'));
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await deleteChannel(currentUser.token, serverId, channelId);
      if (response.ok) {
        const updatedServer = {
          ...server,
          channels: (server.channels || []).filter(ch => ch.id !== channelId),
        };
        dispatch(updateServerRedux(updatedServer));
        alert(t('channelDeleted'));
      }
    } catch (error) {
      console.error('Failed to delete channel:', error);
      alert(t('channelDeleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          minHeight: 500,
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab label={t('overview')} />
          <Tab label={t('channelsTab')} />
          <Tab label={t('members')} />
          {isOwner && <Tab label={t('dangerZone')} />}
        </Tabs>
      </DialogTitle>

      <DialogContent>
        {/* Огляд */}
        <TabPanel value={tab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={serverIcon || undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                    fontWeight: 600,
                  }}
                >
                  {!serverIcon && server.name[0]?.toUpperCase()}
                </Avatar>
                {isOwner && (
                  <IconButton
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    <CameraIcon sx={{ fontSize: '0.9rem' }} />
                  </IconButton>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleIconUpload}
                />
              </Box>
              <Box>
                <Typography variant="h6">{server.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('membersCount')}: {server.members?.length || 0}
                </Typography>
              </Box>
            </Box>

            <TextField
              label={t('serverName')}
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              fullWidth
              disabled={!isOwner || loading}
            />

            <TextField
              label={t('serverDescription')}
              value={serverDescription}
              onChange={(e) => setServerDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={!isOwner || loading}
              placeholder={t('serverDescriptionPlaceholder')}
            />

            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>
                {t('serverBanner')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  value={serverBanner}
                  onChange={(e) => setServerBanner(e.target.value)}
                  fullWidth
                  disabled={!isOwner || loading}
                  placeholder="https://example.com/banner.jpg"
                  helperText={t('bannerHint')}
                  size="small"
                />
                <Button
                  variant="outlined"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={!isOwner || loading}
                  sx={{ mt: 0.5 }}
                >
                  {t('uploadFile') || 'Upload File'}
                </Button>
              </Box>
              <input
                type="file"
                accept="image/*"
                hidden
                ref={bannerInputRef}
                onChange={handleBannerUpload}
              />
              {serverBanner && (
                <Box
                  sx={{
                    mt: 2,
                    height: 100,
                    borderRadius: 1,
                    ...getBannerPreviewStyles(serverBanner),
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              )}
            </Box>

            <Box>
              <Typography variant="body2" fontWeight={600} mb={1}>
                {t('inviteCode')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  value={customInviteCode}
                  fullWidth
                  InputProps={{ readOnly: !editingCode }}
                  size="small"
                  onChange={(e) => {
                    const val = sanitizeInviteCode(e.target.value);
                    setCustomInviteCode(val);
                  }}
                  disabled={!editingCode && !isOwner}
                />
                <Button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(customInviteCode);
                      setCodeCopyMessage(t('copiedToClipboard'));
                      setTimeout(() => setCodeCopyMessage(''), 2000);
                    } catch (err) {
                      console.error('Failed to copy:', err);
                      setCodeCopyMessage('Failed to copy');
                    }
                  }}
                  variant="outlined"
                  sx={{
                    minWidth: '100px',
                  }}
                >
                  {codeCopyMessage || t('copy')}
                </Button>
                {isOwner && (
                  <Button
                    onClick={() => {
                      if (editingCode) {
                        handleSaveInviteCode();
                      } else {
                        setEditingCode(true);
                      }
                    }}
                    variant="outlined"
                    size="small"
                    disabled={loading}
                  >
                    {editingCode ? t('save') : t('edit')}
                  </Button>
                )}
              </Box>
            </Box>

            {isOwner && (
              <Button
                variant="contained"
                onClick={handleUpdateServer}
                disabled={loading}
              >
                {t('saveChanges')}
              </Button>
            )}
          </Box>
        </TabPanel>

        {/* Канали */}
        <TabPanel value={tab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">{t('manageChannels')}</Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                placeholder={t('channelName')}
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                size="small"
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={() => setChannelType(channelType === 'text' ? 'voice' : 'text')}
                startIcon={
                  channelType === 'text' ? <TextChannelIcon /> : <VoiceChannelIcon />
                }
              >
                {channelType === 'text' ? 'Text' : 'Voice'}
              </Button>
              <IconButton
                color="primary"
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim() || loading}
              >
                <AddIcon />
              </IconButton>
            </Box>

            <List>
              {(server.channels || []).map((channel) => (
                <ListItem key={channel.id}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            color: channel.type === 'text' ? 'primary.main' : 'success.main',
                          }}
                        >
                          {channel.type === 'text' ? (
                            <TextChannelIcon fontSize="small" />
                          ) : (
                            <VoiceChannelIcon fontSize="small" />
                          )}
                        </Box>
                        <span>{channel.name}</span>
                      </Box>
                    }
                  />
                  {isOwner && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteChannel(channel.id)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        </TabPanel>

        {/* Члени */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{t('serverMembers')}</Typography>
              <Button
                variant="outlined"
                onClick={() => setRolesDialogOpen(true)}
              >
                {t('manageRoles')}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {t('membersCount')}: {server.members?.length || 0}
            </Typography>
            
            {/* Members list */}
            <List sx={{ width: '100%' }}>
              {server.members?.map((member: any) => {
                const memberId =
                  typeof member === 'string'
                    ? member
                    : String(member.userId || member.id || member._id || member.username || '');
                const memberName =
                  typeof member === 'string'
                    ? member
                    : String(member.displayName || member.username || memberId);
                const isOwner = String(server.ownerId) === memberId;
                const memberRole = server.memberRoles?.[memberId];
                const role = server.roles?.find(r => r.id === memberRole);

                return (
                  <ListItem
                    key={memberId || memberName}
                    sx={{
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {(memberName || memberId)[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {memberName || memberId}
                          {isOwner && ' (Owner)'}
                        </Typography>
                        {role && (
                          <Typography variant="caption" sx={{ color: role.color || 'text.secondary' }}>
                            {role.name}
                          </Typography>
                        )}
                      </Box>
                      {isOwner && (
                        <AdminIcon sx={{ color: '#FFD700', fontSize: 20 }} />
                      )}
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </Box>
        </TabPanel>

        {/* Небезпечна зона */}
        {isOwner && (
          <TabPanel value={tab} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="error">
                {t('dangerZoneWarning')}
              </Alert>

              <Box sx={{ p: 2, border: '1px solid', borderColor: 'error.main', borderRadius: 1 }}>
                <Typography variant="h6" color="error" mb={1}>
                  {t('deleteServer')}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {t('deleteServerDescription')}
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteServer}
                  disabled={loading}
                >
                  {t('deleteServer')}
                </Button>
              </Box>
            </Box>
          </TabPanel>
        )}

        {!isOwner && tab === 3 && (
          <TabPanel value={tab} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="warning">
                {t('leaveServerWarning')}
              </Alert>

              <Button
                variant="contained"
                color="warning"
                startIcon={<LeaveIcon />}
                onClick={handleLeaveServer}
                disabled={loading}
              >
                {t('leaveServer')}
              </Button>
            </Box>
          </TabPanel>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>{t('close')}</Button>
      </DialogActions>

      <ServerRolesDialog
        open={rolesDialogOpen}
        onClose={() => setRolesDialogOpen(false)}
        serverId={serverId}
      />
    </Dialog>
  );
};

export default ServerSettingsDialog;
