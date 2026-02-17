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
        sx={(theme) => ({
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
          overflow: 'hidden',
          background:
            theme.palette.mode === 'dark'
              ? 'radial-gradient(800px circle at 10% 20%, rgba(34,197,94,0.2), transparent 55%), radial-gradient(900px circle at 90% 10%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(700px circle at 80% 90%, rgba(16,185,129,0.12), transparent 60%), linear-gradient(120deg, #0b0f14 0%, #0d1117 35%, #0f172a 100%)'
              : 'radial-gradient(800px circle at 10% 20%, rgba(16,185,129,0.18), transparent 55%), radial-gradient(900px circle at 90% 10%, rgba(79,70,229,0.18), transparent 60%), linear-gradient(120deg, #eef2ff 0%, #f8fafc 45%, #e2e8f0 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(-45deg, #0b0f14, #111827, #1e293b, #0f172a)'
                : 'linear-gradient(-45deg, #eef2ff, #f8fafc, #e2e8f0, #dbeafe)',
            backgroundSize: '400% 400%',
            animation: 'welcomeGradientShift 14s ease infinite',
            opacity: 0.6,
          },
          '@keyframes welcomeGradientShift': {
            '0%': {
              backgroundPosition: '0% 50%',
            },
            '50%': {
              backgroundPosition: '100% 50%',
            },
            '100%': {
              backgroundPosition: '0% 50%',
            },
          },
        })}
      >
        <Box
          sx={{
            textAlign: 'center',
            animation: 'welcomeSlideUp 0.8s ease-out',
            position: 'relative',
            zIndex: 1,
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
