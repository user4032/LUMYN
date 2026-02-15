import React, { useEffect, useState } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';

interface WelcomeAnimationProps {
  isNewUser: boolean;
  onFinish: () => void;
}

const WelcomeAnimation: React.FC<WelcomeAnimationProps> = ({ isNewUser, onFinish }) => {
  const language = useSelector((state: RootState) => state.ui.language);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onFinish, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <Fade in={show} timeout={500}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: 9999,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            animation: 'welcomeSlideUp 0.8s ease-out',
            '@keyframes welcomeSlideUp': {
              '0%': {
                opacity: 0,
                transform: 'translateY(40px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Typography
            variant="h2"
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              mb: 1,
              textShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {isNewUser ? t('welcome') : t('welcomeBack')}
          </Typography>
          <Box
            sx={{
              width: '80px',
              height: '4px',
              bgcolor: 'rgba(255,255,255,0.8)',
              margin: '0 auto',
              borderRadius: '2px',
              animation: 'welcomeLineExpand 0.6s ease-out 0.3s both',
              '@keyframes welcomeLineExpand': {
                '0%': {
                  width: '0px',
                  opacity: 0,
                },
                '100%': {
                  width: '80px',
                  opacity: 1,
                },
              },
            }}
          />
        </Box>
      </Box>
    </Fade>
  );
};

export default WelcomeAnimation;
