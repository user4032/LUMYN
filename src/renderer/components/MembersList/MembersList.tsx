import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider } from '@mui/material';
import { EmojiEvents as AdminIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { addChat } from '@store/slices/chatsSlice';
import { t } from '@i18n/index';
import UserProfileDialog from '../UserProfileDialog/UserProfileDialog';

interface Member {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'offline' | 'idle' | 'dnd' | 'away' | 'busy' | 'invisible';
  customStatus?: string;
  bio?: string;
}

interface MembersListProps {
  serverId: string;
  onSelectChat?: (chatId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  online: '#3ba55d',
  offline: '#747f8d',
  idle: '#faa61a',
  dnd: '#ed4245',
  away: '#faa61a',
  busy: '#ed4245',
  invisible: '#747f8d',
};

const MembersList: React.FC<MembersListProps> = ({ serverId, onSelectChat }) => {
  const dispatch = useDispatch();
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const chats = useSelector((state: RootState) => state.chats.chats);
  const language = useSelector((state: RootState) => state.ui.language);
  const server = useSelector((state: RootState) => state.servers.servers.find(s => s.id === serverId));

  const frameStyles: Record<string, { bg: string; glow: string; border: string }> = {
    default: {
      bg: 'linear-gradient(180deg, #5865F2 0%, #5865F2 100%)',
      glow: '0 0 10px rgba(88,101,242,0.5)',
      border: '2px solid #5865F2',
    },
    neon: {
      bg: 'conic-gradient(from 120deg, #00f5ff, #7c4dff, #00f5ff)',
      glow: '0 0 12px rgba(124,77,255,0.6)',
      border: '2px solid #7c4dff',
    },
    aurora: {
      bg: 'radial-gradient(circle at 25% 25%, rgba(87,242,135,0.9), transparent 45%), radial-gradient(circle at 75% 75%, rgba(88,101,242,0.9), transparent 45%), conic-gradient(#1f2937, #111827)',
      glow: '0 0 14px rgba(87,242,135,0.45)',
      border: '2px solid rgba(88,101,242,0.9)',
    },
    ember: {
      bg: 'conic-gradient(#f9a826, #ed4245, #f9a826)',
      glow: '0 0 12px rgba(249,168,38,0.5)',
      border: '2px solid #ed4245',
    },
    cobalt: {
      bg: 'repeating-conic-gradient(#22d3ee 0 12deg, #3b82f6 12deg 24deg)',
      glow: '0 0 12px rgba(34,211,238,0.45)',
      border: '2px solid #22d3ee',
    },
    glitch: {
      bg: 'linear-gradient(135deg, #eb459e 0%, #5865F2 50%, #57F287 100%)',
      glow: '0 0 12px rgba(235,69,158,0.45)',
      border: '2px solid #eb459e',
    },
  };

  const handleSendMessage = (userId: string) => {
    const existingChat = chats.find(c => c.id === userId);

    if (!existingChat) {
      const user = members.find(m => m.id === userId);
      if (user) {
        dispatch(addChat({
          id: user.id,
          name: user.displayName || user.username,
          avatar: user.avatar,
          type: 'private',
          unreadCount: 0,
          status: user.status === 'online' ? 'online' : 'offline',
        }));
      }
    }

    if (onSelectChat) {
      onSelectChat(userId);
    }
  };

  useEffect(() => {
    const loadMembers = async () => {
      if (!serverId) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('disgram_auth_token');
        if (!token) return;

        const response = await fetch(`http://localhost:4777/servers/${serverId}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.members) {
            setMembers(data.members);
          }
        }
      } catch (error) {
        console.error('Failed to load server members:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [serverId]);

  const onlineMembersCount = members.filter(m => ['online', 'idle', 'dnd', 'busy', 'away'].includes(m.status)).length;

  const handleMemberClick = (member: Member) => {
    setSelectedUser(member);
    setProfileOpen(true);
  };

  const renderMember = (member: Member, dimmed: boolean) => {
    const isOwner = server?.ownerId === member.id;
    const memberRoleId = server?.memberRoles?.[member.id];
    const role = server?.roles?.find(r => r.id === memberRoleId);
    const roleLabel = isOwner ? t('adminRole') : role?.name;
    const secondaryText = member.customStatus || roleLabel || '';
    const frameId = member.id === currentUser?.id
      ? (localStorage.getItem('disgram_profile_frame') || 'default')
      : 'default';
    const frameStyle = frameStyles[frameId] || frameStyles.default;

    return (
      <ListItem
        key={member.id}
        onClick={() => handleMemberClick(member)}
        sx={{
          borderRadius: 1,
          cursor: 'pointer',
          opacity: dimmed ? 0.5 : 1,
          transition: 'all 0.15s',
          py: 0.75,
          '&:hover .member-frame': {
            opacity: 1,
            transform: 'scale(1.06)',
          },
          '&:hover': {
            bgcolor: 'action.hover',
            opacity: 1,
          },
        }}
      >
        <ListItemAvatar sx={{ minWidth: 40 }}>
          <Box sx={{ position: 'relative' }}>
            <Box
              className="member-frame"
              sx={{
                position: 'absolute',
                top: -4,
                left: -4,
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: frameStyle.border,
                boxShadow: frameStyle.glow,
                backgroundImage: frameStyle.bg,
                WebkitMask: 'radial-gradient(farthest-side, transparent calc(50% - 4px), #000 calc(50% - 3px))',
                mask: 'radial-gradient(farthest-side, transparent calc(50% - 4px), #000 calc(50% - 3px))',
                opacity: 0.6,
                transition: 'all 0.2s ease',
                pointerEvents: 'none',
              }}
            />
            <Avatar
              src={member.avatar}
              sx={{
                width: 32,
                height: 32,
                bgcolor: dimmed ? 'action.disabled' : 'primary.main',
                fontSize: '0.9rem',
              }}
            >
              {member.displayName[0].toUpperCase()}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                right: 0,
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? '#2f3136' : '#f2f3f5',
                bgcolor: STATUS_COLORS[member.status] || STATUS_COLORS.offline,
              }}
            />
          </Box>
        </ListItemAvatar>
        <ListItemText
          primary={member.displayName}
          secondary={secondaryText}
          primaryTypographyProps={{
            variant: 'body2',
            sx: { fontWeight: 500, color: 'text.primary', mb: 0.25 },
          }}
          secondaryTypographyProps={{
            variant: 'caption',
            sx: { fontSize: '0.65rem', color: 'text.secondary', display: 'block', lineHeight: 1.3 },
          }}
        />
        {isOwner && (
          <AdminIcon sx={{ color: '#FFD700', fontSize: 18 }} />
        )}
      </ListItem>
    );
  };

  return (
    <>
      <Box
        sx={(theme) => ({
          width: 240,
          bgcolor: theme.palette.mode === 'dark' ? '#2f3136' : '#f2f3f5',
          borderLeft: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflowY: 'auto',
        })}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Учасники — {members.length}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Завантаження...
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ px: 2, pb: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                Онлайн — {onlineMembersCount}
              </Typography>
            </Box>

            <List sx={{ px: 1, py: 0 }}>
              {members.filter(m => ['online', 'idle', 'dnd', 'busy', 'away'].includes(m.status))
                .map(member => renderMember(member, false))}
            </List>

            {members.filter(m => ['offline', 'invisible'].includes(m.status)).length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ px: 2, pb: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                    Оффлайн — {members.filter(m => ['offline', 'invisible'].includes(m.status)).length}
                  </Typography>
                </Box>

                <List sx={{ px: 1, py: 0 }}>
                  {members.filter(m => ['offline', 'invisible'].includes(m.status))
                    .map(member => renderMember(member, true))}
                </List>
              </>
            )}
          </>
        )}
      </Box>

      <UserProfileDialog
        open={profileOpen}
        onClose={() => {
          setProfileOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onMessage={handleSendMessage}
      />
    </>
  );
};

export default MembersList;
