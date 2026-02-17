import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Add as AddIcon } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';

import {
  createThreadsPost,
  getThreadsFeed,
  getThreadsProfile,
  followThreadsUser,
  ThreadsPost,
  ThreadsProfile,
} from '@/api/threads';

const frameStyles: Record<string, { bg: string; glow: string; border: string }> = {
  default: {
    bg: 'linear-gradient(180deg, #5865F2 0%, #5865F2 100%)',
    glow: '0 0 12px rgba(88,101,242,0.5)',
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

const ThreadsView: React.FC = () => {
  const language = useSelector((state: RootState) => state.ui.language);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const [posts, setPosts] = React.useState<ThreadsPost[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [composerText, setComposerText] = React.useState('');
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [profileData, setProfileData] = React.useState<ThreadsProfile | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(false);

  const loadFeed = React.useCallback(async () => {
    const token = localStorage.getItem('disgram_auth_token');
    if (!token) return;
    setLoading(true);
    try {
      const response = await getThreadsFeed(token);
      setPosts(response.posts || []);
    } catch (e) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProfile = React.useCallback(async (userId: string) => {
    const token = localStorage.getItem('disgram_auth_token');
    if (!token) return;
    setProfileLoading(true);
    try {
      const response = await getThreadsProfile(token, userId);
      setProfileData({
        profile: response.profile,
        followersCount: response.followersCount,
        followingCount: response.followingCount,
        isFollowing: response.isFollowing,
        posts: response.posts,
      });
    } catch (e) {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!profileId) {
      loadFeed();
    }
  }, [loadFeed, profileId]);

  React.useEffect(() => {
    if (profileId) {
      loadProfile(profileId);
    }
  }, [loadProfile, profileId]);

  const handleCreatePost = async () => {
    const token = localStorage.getItem('disgram_auth_token');
    if (!token) return;
    if (!composerText.trim()) return;

    try {
      await createThreadsPost(token, composerText.trim());
      setComposerOpen(false);
      setComposerText('');
      loadFeed();
    } catch (e) {
      // ignore
    }
  };

  const handleFollowToggle = async () => {
    if (!profileData || !profileId) return;
    const token = localStorage.getItem('disgram_auth_token');
    if (!token) return;

    try {
      const response = await followThreadsUser(token, profileId, profileData.isFollowing ? 'unfollow' : 'follow');
      setProfileData({
        ...profileData,
        isFollowing: response.following,
      });
    } catch (e) {
      // ignore
    }
  };

  const formatTime = (timestamp: number) => {
    const locale = language === 'en' ? enUS : uk;
    return formatDistanceToNow(timestamp, { addSuffix: true, locale });
  };

  const renderPost = (post: ThreadsPost) => (
    <Box
      key={post.id}
      sx={(theme) => ({
        p: 2,
        borderRadius: 3,
        bgcolor: theme.palette.background.paper,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 12px 30px rgba(0,0,0,0.25)'
          : '0 12px 30px rgba(15,23,42,0.08)',
      })}
    >
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Avatar
          src={post.author?.avatar}
          sx={{ width: 40, height: 40, bgcolor: 'primary.main', cursor: 'pointer' }}
          onClick={() => setProfileId(post.userId)}
        >
          {post.author?.displayName?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setProfileId(post.userId)}
            >
              {post.author?.displayName || t('someone')}
            </Typography>
            {post.author?.username && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                @{post.author.username}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
              {formatTime(post.createdAt)}
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const renderProfile = () => {
    if (profileLoading) {
      return (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!profileData) {
      return (
        <Box sx={{ p: 3, color: 'text.secondary' }}>
          {t('noUsersFound')}
        </Box>
      );
    }

    const { profile } = profileData;
    const frameStyle = frameStyles[profile.profileFrame || 'default'] || frameStyles.default;

    return (
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ px: 3, pt: 2, pb: 3 }}>
          <Box
            sx={(theme) => ({
              height: 160,
              borderRadius: 4,
              backgroundImage: profile.profileBanner
                ? `url(${profile.profileBanner})`
                : theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #0f172a 0%, #111827 60%, #1f2937 100%)'
                  : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #bfdbfe 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            })}
          />

          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: -6 }}>
            <Box sx={{ position: 'relative' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: -6,
                  left: -6,
                  width: 112,
                  height: 112,
                  borderRadius: '50%',
                  border: frameStyle.border,
                  boxShadow: frameStyle.glow,
                  backgroundImage: frameStyle.bg,
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(50% - 6px), #000 calc(50% - 5px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(50% - 6px), #000 calc(50% - 5px))',
                  pointerEvents: 'none',
                }}
              />
              <Avatar
                src={profile.avatar}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'primary.main',
                  border: '4px solid',
                  borderColor: 'background.paper',
                  fontSize: '2rem',
                }}
              >
                {profile.displayName?.[0]?.toUpperCase()}
              </Avatar>
            </Box>

            <Box sx={{ flex: 1, pb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {profile.displayName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                @{profile.username}
              </Typography>
            </Box>

            {currentUser?.id !== profile.id && (
              <Button
                variant={profileData.isFollowing ? 'outlined' : 'contained'}
                onClick={handleFollowToggle}
                sx={{
                  textTransform: 'none',
                  borderRadius: 999,
                  px: 3,
                  py: 1,
                }}
              >
                {profileData.isFollowing ? t('unfollow') : t('follow')}
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        <Box sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {profileData.posts.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('noPosts')}
            </Typography>
          ) : (
            profileData.posts.map(renderPost)
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={(theme) => ({
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.mode === 'dark' ? '#101116' : '#edf2ff',
        overflow: 'hidden',
      })}
    >
      <Box
        sx={(theme) => ({
          height: 64,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {profileId && (
            <IconButton onClick={() => setProfileId(null)}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('threads')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!profileId && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setComposerOpen(true)}
              sx={{ textTransform: 'none', borderRadius: 999 }}
            >
              {t('createPost')}
            </Button>
          )}
        </Box>
      </Box>

      {profileId ? (
        renderProfile()
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <CircularProgress />
            </Box>
          ) : posts.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('noPosts')}
            </Typography>
          ) : (
            posts.map(renderPost)
          )}
        </Box>
      )}

      <Dialog open={composerOpen} onClose={() => setComposerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('createPost')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder={t('postPlaceholder')}
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposerOpen(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleCreatePost}>
            {t('post')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ThreadsView;
