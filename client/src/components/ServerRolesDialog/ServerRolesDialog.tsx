import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Collapse,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Select,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandIcon,
  ColorLens as ColorIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import { createRole, updateRole, deleteRole, assignRole } from '@/api/social';
import { updateServer as updateServerRedux } from '@store/slices/serversSlice';

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  position: number;
}

interface ServerRolesDialogProps {
  open: boolean;
  onClose: () => void;
  serverId: string;
}

const COLORS = [
  '#5865F2', '#3BA55D', '#FAA81A', '#ED4245', '#EB459E',
  '#9146FF', '#00C9FF', '#FF6B6B', '#4ECDC4', '#45B7D1',
];

const PERMISSIONS = [
  { id: 'admin', name: 'Administrator', nameUA: 'Адміністратор', description: 'All permissions', descriptionUA: 'Всі права' },
  { id: 'manage_server', name: 'Manage Server', nameUA: 'Керування сервером', description: 'Edit server settings', descriptionUA: 'Редагувати налаштування' },
  { id: 'manage_channels', name: 'Manage Channels', nameUA: 'Керування каналами', description: 'Create, edit, delete channels', descriptionUA: 'Створювати, редагувати, видаляти канали' },
  { id: 'manage_roles', name: 'Manage Roles', nameUA: 'Керування ролями', description: 'Create and edit roles', descriptionUA: 'Створювати та редагувати ролі' },
  { id: 'kick_members', name: 'Kick Members', nameUA: 'Викидати учасників', description: 'Remove members from server', descriptionUA: 'Видаляти учасників з сервера' },
  { id: 'ban_members', name: 'Ban Members', nameUA: 'Банити учасників', description: 'Ban members from server', descriptionUA: 'Блокувати учасників' },
  { id: 'manage_messages', name: 'Manage Messages', nameUA: 'Керування повідомленнями', description: 'Delete and pin messages', descriptionUA: 'Видаляти та закріплювати повідомлення' },
  { id: 'send_messages', name: 'Send Messages', nameUA: 'Надсилати повідомлення', description: 'Send messages in channels', descriptionUA: 'Надсилати повідомлення в каналах' },
  { id: 'attach_files', name: 'Attach Files', nameUA: 'Прикріпляти файли', description: 'Upload images and files', descriptionUA: 'Завантажувати зображення та файли' },
  { id: 'add_reactions', name: 'Add Reactions', nameUA: 'Додавати реакції', description: 'Add emoji reactions', descriptionUA: 'Додавати емодзі реакції' },
  { id: 'mention_everyone', name: 'Mention @everyone', nameUA: 'Згадувати @everyone', description: 'Mention all members', descriptionUA: 'Згадувати всіх учасників' },
  { id: 'connect_voice', name: 'Connect to Voice', nameUA: 'Підключатись до голосу', description: 'Join voice channels', descriptionUA: 'Приєднуватись до голосових каналів' },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'everyone',
    name: '@everyone',
    color: '#99AAB5',
    permissions: ['send_messages', 'attach_files', 'add_reactions', 'connect_voice'],
    position: 0,
  },
];

const ServerRolesDialog: React.FC<ServerRolesDialogProps> = ({ open, onClose, serverId }) => {
  const dispatch = useDispatch();
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [memberRoleAssignments, setMemberRoleAssignments] = useState<Record<string, string>>({});
  
  const language = useSelector((state: RootState) => state.ui.language);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const server = useSelector((state: RootState) => 
    state.servers.servers.find(s => s.id === serverId)
  );

  useEffect(() => {
    if (server && open) {
      // Завантажуємо ролі з сервера або використовуємо дефолтні
      const serverRoles = server.roles || DEFAULT_ROLES;
      setRoles(serverRoles.map(r => ({
        id: r.roleId || r.id,
        name: r.name,
        color: r.color || '#99AAB5',
        permissions: r.permissions || [],
        position: r.position || 0,
      })));
      
      // Завантажуємо призначення ролей для членів
      if (server.memberRoles) {
        setMemberRoleAssignments(server.memberRoles);
      }
    }
  }, [server, open]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim() || !currentUser?.token) return;

    setLoading(true);
    try {
      const response = await createRole(currentUser.token, serverId, {
        name: newRoleName,
        color: COLORS[roles.length % COLORS.length],
        permissions: ['send_messages'],
      });

      if (response.ok && response.server) {
        dispatch(updateServerRedux(response.server));
        setNewRoleName('');
        alert(t('roleCreated') || 'Role created!');
      }
    } catch (error) {
      console.error('Failed to create role:', error);
      alert(t('roleCreationFailed') || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (roleId === 'everyone' || !currentUser?.token) return;
    
    const confirmed = window.confirm(t('confirmDeleteRole') || 'Delete this role?');
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await deleteRole(currentUser.token, serverId, roleId);
      if (response.ok && response.server) {
        dispatch(updateServerRedux(response.server));
        if (selectedRole?.id === roleId) {
          setSelectedRole(null);
        }
        alert(t('roleDeleted') || 'Role deleted!');
      }
    } catch (error) {
      console.error('Failed to delete role:', error);
      alert(t('roleDeleteFailed') || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = async (roleId: string, permissionId: string) => {
    if (!currentUser?.token) return;
    
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const hasPermission = role.permissions.includes(permissionId);
    const newPermissions = hasPermission
      ? role.permissions.filter(p => p !== permissionId)
      : [...role.permissions, permissionId];

    setLoading(true);
    try {
      const response = await updateRole(currentUser.token, serverId, roleId, {
        permissions: newPermissions,
      });
      
      if (response.ok && response.server) {
        dispatch(updateServerRedux(response.server));
      }
    } catch (error) {
      console.error('Failed to update role permissions:', error);
      alert(t('roleUpdateFailed') || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeColor = async (roleId: string, color: string) => {
    if (!currentUser?.token) return;

    setLoading(true);
    try {
      const response = await updateRole(currentUser.token, serverId, roleId, {
        color,
      });
      
      if (response.ok && response.server) {
        dispatch(updateServerRedux(response.server));
      }
    } catch (error) {
      console.error('Failed to update role color:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (userId: string, roleId: string | null) => {
    if (!currentUser?.token) return;

    setLoading(true);
    try {
      const response = await assignRole(currentUser.token, serverId, userId, roleId);
      
      if (response.ok && response.server) {
        dispatch(updateServerRedux(response.server));
        alert(t('roleAssigned') || 'Role assigned!');
      }
    } catch (error) {
      console.error('Failed to assign role:', error);
      alert(t('roleAssignFailed') || 'Failed to assign role');
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
          minHeight: 600,
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body1" fontWeight={600}>{t('rolesManagement')}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t('rolesDescription')}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', height: 500 }}>
        {/* Ліва панель - список ролей */}
        <Box
          sx={{
            width: 240,
            borderRight: '1px solid',
            borderColor: 'divider',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder={t('newRoleName')}
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRole()}
              fullWidth
            />
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateRole}
              disabled={!newRoleName.trim()}
              sx={{ mt: 1 }}
            >
              {t('createRole')}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            {t('roles')} — {roles.length}
          </Typography>

          <List sx={{ flex: 1, overflow: 'auto' }}>
            {roles.map((role) => (
              <ListItem
                key={role.id}
                button
                selected={selectedRole?.id === role.id}
                onClick={() => {
                  setSelectedRole(role);
                  setExpandedRole(role.id);
                }}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: role.color,
                    mr: 1.5,
                  }}
                />
                <ListItemText
                  primary={role.name}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 600,
                  }}
                />
                {role.id !== 'everyone' && (
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Права панель - налаштування ролі */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {selectedRole ? (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  {selectedRole.name}
                </Typography>

                <Typography variant="body2" fontWeight={600} mb={1}>
                  {t('roleColor')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  {COLORS.map((color) => (
                    <Box
                      key={color}
                      onClick={() => handleChangeColor(selectedRole.id, color)}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: color,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: selectedRole.color === color ? 'white' : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                    />
                  ))}
                </Box>

                {selectedRole.id === 'everyone' && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {t('everyoneRoleInfo')}
                  </Alert>
                )}
              </Box>

              <Typography variant="h6" fontWeight={600} mb={2}>
                {t('permissions')}
              </Typography>

              <FormGroup>
                {PERMISSIONS.map((permission) => (
                  <Box
                    key={permission.id}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: selectedRole.permissions.includes(permission.id)
                        ? 'action.hover'
                        : 'transparent',
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedRole.permissions.includes(permission.id)}
                          onChange={() => handleTogglePermission(selectedRole.id, permission.id)}
                          disabled={permission.id === 'admin' && selectedRole.id === 'everyone'}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {language === 'uk' ? permission.nameUA : permission.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {language === 'uk' ? permission.descriptionUA : permission.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                ))}
              </FormGroup>
              
              {/* Призначення ролей учасникам */}
              {selectedRole.id !== 'everyone' && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    {t('assignRoleToMembers') || 'Assign to Members'}
                  </Typography>
                  <List>
                    {(server?.members || []).map((member: any) => {
                      const memberId = String(member.userId || member.id || member._id);
                      const memberName = member.displayName || member.username || memberId;
                      const currentRoleId = memberRoleAssignments[memberId];
                      const hasThisRole = currentRoleId === selectedRole.id;
                      
                      return (
                        <ListItem 
                          key={memberId}
                          sx={{
                            borderRadius: 1,
                            mb: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                            {memberName[0]?.toUpperCase()}
                          </Avatar>
                          <ListItemText
                            primary={memberName}
                            secondary={hasThisRole ? selectedRole.name : (currentRoleId ? roles.find(r => r.id === currentRoleId)?.name : t('noRole'))}
                          />
                          <Button
                            size="small"
                            variant={hasThisRole ? 'outlined' : 'contained'}
                            onClick={() => handleAssignRole(memberId, hasThisRole ? null : selectedRole.id)}
                            disabled={loading}
                          >
                            {hasThisRole ? t('remove') : t('assign')}
                          </Button>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                opacity: 0.5,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {t('selectRole')}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={loading}>{t('close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ServerRolesDialog;
