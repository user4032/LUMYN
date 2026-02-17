import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Chip,
  TextField,
} from '@mui/material';
import {
  SportsEsports as GamingIcon,
  School as EducationIcon,
  Group as CommunityIcon,
  Mic as PodcastIcon,
  Code as DevIcon,
  MusicNote as MusicIcon,
  Movie as MediaIcon,
  Science as ScienceIcon,
  TextSnippet as TextChannelIcon,
  VolumeUp as VoiceChannelIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';

interface ServerTemplate {
  id: string;
  name: string;
  nameUA: string;
  description: string;
  descriptionUA: string;
  icon: React.ReactNode;
  color: string;
  banner?: string;
  channels: {
    name: string;
    type: 'text' | 'voice';
    category?: string;
  }[];
}

const TEMPLATES: ServerTemplate[] = [
  {
    id: 'gaming',
    name: 'Gaming',
    nameUA: 'Ігровий',
    description: 'Perfect for gaming communities with voice channels and game rooms',
    descriptionUA: 'Ідеально для ігрових спільнот з голосовими каналами та кімнатами',
    icon: <GamingIcon sx={{ fontSize: 48 }} />,
    color: '#9146FF',
    banner: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    channels: [
      { name: 'welcome', type: 'text', category: 'Information' },
      { name: 'rules', type: 'text', category: 'Information' },
      { name: 'general', type: 'text', category: 'Chat' },
      { name: 'memes', type: 'text', category: 'Chat' },
      { name: 'looking-for-game', type: 'text', category: 'Gaming' },
      { name: 'General Voice', type: 'voice', category: 'Voice Channels' },
      { name: 'Gaming Room 1', type: 'voice', category: 'Voice Channels' },
      { name: 'Gaming Room 2', type: 'voice', category: 'Voice Channels' },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    nameUA: 'Освіта',
    description: 'Organize study groups, share resources, and collaborate',
    descriptionUA: 'Організуйте навчальні групи, діліться ресурсами та співпрацюйте',
    icon: <EducationIcon sx={{ fontSize: 48 }} />,
    color: '#3BA55D',
    banner: 'linear-gradient(135deg, #3BA55D 0%, #2d7a4f 100%)',
    channels: [
      { name: 'announcements', type: 'text', category: 'Information' },
      { name: 'general', type: 'text', category: 'Chat' },
      { name: 'homework-help', type: 'text', category: 'Study' },
      { name: 'resources', type: 'text', category: 'Study' },
      { name: 'projects', type: 'text', category: 'Study' },
      { name: 'Study Room', type: 'voice', category: 'Voice' },
      { name: 'Group Work', type: 'voice', category: 'Voice' },
    ],
  },
  {
    id: 'community',
    name: 'Community',
    nameUA: 'Спільнота',
    description: 'General purpose server for any community',
    descriptionUA: 'Універсальний сервер для будь-якої спільноти',
    icon: <CommunityIcon sx={{ fontSize: 48 }} />,
    color: '#FAA81A',
    banner: 'linear-gradient(135deg, #FAA81A 0%, #f39700 100%)',
    channels: [
      { name: 'welcome', type: 'text', category: 'Info' },
      { name: 'general', type: 'text', category: 'Chat' },
      { name: 'off-topic', type: 'text', category: 'Chat' },
      { name: 'media', type: 'text', category: 'Sharing' },
      { name: 'Lounge', type: 'voice', category: 'Voice' },
      { name: 'Chill Zone', type: 'voice', category: 'Voice' },
    ],
  },
  {
    id: 'dev',
    name: 'Developer',
    nameUA: 'Розробка',
    description: 'For developer teams and coding communities',
    descriptionUA: 'Для команд розробників та programming спільнот',
    icon: <DevIcon sx={{ fontSize: 48 }} />,
    color: '#5865F2',
    banner: 'linear-gradient(135deg, #5865F2 0%, #404edd 100%)',
    channels: [
      { name: 'announcements', type: 'text', category: 'Info' },
      { name: 'general', type: 'text', category: 'Chat' },
      { name: 'code-help', type: 'text', category: 'Development' },
      { name: 'show-your-work', type: 'text', category: 'Development' },
      { name: 'bugs', type: 'text', category: 'Development' },
      { name: 'Dev Voice', type: 'voice', category: 'Voice' },
      { name: 'Pair Programming', type: 'voice', category: 'Voice' },
    ],
  },
  {
    id: 'music',
    name: 'Music',
    nameUA: 'Музика',
    description: 'Share music, jam together, and discover new sounds',
    descriptionUA: 'Діліться музикою, грайте разом та відкривайте нові звуки',
    icon: <MusicIcon sx={{ fontSize: 48 }} />,
    color: '#ED4245',
    banner: 'linear-gradient(135deg, #ED4245 0%, #d83c3a 100%)',
    channels: [
      { name: 'general', type: 'text', category: 'Chat' },
      { name: 'new-releases', type: 'text', category: 'Music' },
      { name: 'share-your-music', type: 'text', category: 'Music' },
      { name: 'playlists', type: 'text', category: 'Music' },
      { name: 'Listening Party', type: 'voice', category: 'Voice' },
      { name: 'Jam Session', type: 'voice', category: 'Voice' },
    ],
  },
  {
    id: 'podcast',
    name: 'Podcast',
    nameUA: 'Подкаст',
    description: 'Perfect for podcasters and content creators',
    descriptionUA: 'Ідеально для подкастерів та контент-криейторів',
    icon: <PodcastIcon sx={{ fontSize: 48 }} />,
    color: '#EB459E',
    banner: 'linear-gradient(135deg, #EB459E 0%, #d9328a 100%)',
    channels: [
      { name: 'announcements', type: 'text', category: 'Info' },
      { name: 'general', type: 'text', category: 'Chat' },
      { name: 'episode-ideas', type: 'text', category: 'Production' },
      { name: 'Recording Room', type: 'voice', category: 'Voice' },
      { name: 'Planning', type: 'voice', category: 'Voice' },
    ],
  },
];

interface ServerTemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, template: ServerTemplate) => void;
}

const ServerTemplatesDialog: React.FC<ServerTemplatesDialogProps> = ({ open, onClose, onCreate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ServerTemplate | null>(null);
  const [serverName, setServerName] = useState('');
  const language = useSelector((state: RootState) => state.ui.language);

  const handleSelectTemplate = (template: ServerTemplate) => {
    setSelectedTemplate(template);
    setServerName(language === 'uk' ? `Мій ${template.nameUA} Сервер` : `My ${template.name} Server`);
  };

  const handleCreate = () => {
    if (selectedTemplate && serverName.trim()) {
      onCreate(serverName, selectedTemplate);
      setSelectedTemplate(null);
      setServerName('');
      onClose();
    }
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setServerName('');
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
      <DialogTitle>
        {selectedTemplate ? (
          <Box>
            <Typography variant="h6">{t('customizeServer')}</Typography>
            <Typography variant="caption" color="text.secondary">
              {language === 'uk' ? selectedTemplate.nameUA : selectedTemplate.name}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6">{t('chooseTemplate')}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t('templateDescription')}
            </Typography>
          </Box>
        )}
      </DialogTitle>

      <DialogContent>
        {!selectedTemplate ? (
          <Grid container spacing={2}>
            {TEMPLATES.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleSelectTemplate(template)}>
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          bgcolor: template.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                          color: 'white',
                        }}
                      >
                        {template.icon}
                      </Box>
                      <Typography variant="h6" fontWeight={600} mb={1}>
                        {language === 'uk' ? template.nameUA : template.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {language === 'uk' ? template.descriptionUA : template.description}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={`${template.channels.length} ${t('channels')}`}
                          size="small"
                          sx={{ bgcolor: `${template.color}20`, color: template.color }}
                        />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box>
            <TextField
              fullWidth
              label={t('serverName')}
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              sx={{ mb: 3 }}
              autoFocus
            />

            <Typography variant="h6" fontWeight={600} mb={2}>
              {t('includedChannels')}:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {selectedTemplate.channels.map((channel, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: channel.type === 'text' ? 'primary.main' : 'success.main',
                    }}
                  >
                    {channel.type === 'text' ? (
                      <TextChannelIcon fontSize="small" />
                    ) : (
                      <VoiceChannelIcon fontSize="small" />
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {channel.name}
                    </Typography>
                    {channel.category && (
                      <Typography variant="caption" color="text.secondary">
                        {channel.category}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={channel.type}
                    size="small"
                    sx={{
                      bgcolor: channel.type === 'text' ? 'primary.main' : 'success.main',
                      color: 'white',
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {selectedTemplate ? (
          <>
            <Button onClick={handleBack}>{t('back')}</Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={!serverName.trim()}
              sx={{
                bgcolor: selectedTemplate.color,
                '&:hover': {
                  bgcolor: selectedTemplate.color,
                  filter: 'brightness(0.9)',
                },
              }}
            >
              {t('createServer')}
            </Button>
          </>
        ) : (
          <Button onClick={onClose}>{t('cancel')}</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ServerTemplatesDialog;
