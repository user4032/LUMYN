import React, { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { keyframes } from '@mui/system';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import appLogo from '@/assets/app-logo-preview.png';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState('0.1.5');
  const language = useSelector((state: RootState) => state.ui.language);

  useEffect(() => {
    // Завантажуємо користувацьке лого
    try {
      const logo = localStorage.getItem('disgram_logo');
      setCustomLogo(logo);
    } catch (e) {
      // Використовуємо стандартне лого
    }

    // Отримуємо версію додатку
    if (window.electronAPI && window.electronAPI.getAppVersion) {
      window.electronAPI.getAppVersion().then((version: string) => {
        setAppVersion(version);
      });
    }

    // Слухаємо для оновлення логотипу
    const handleLogoUpdate = () => {
      try {
        const logo = localStorage.getItem('disgram_logo');
        setCustomLogo(logo);
      } catch (e) {
        // Використовуємо стандартне лого
      }
    };

    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          setTimeout(() => onFinish(), 300);
          return 100;
        }
        const diff = Math.random() * 15;
        return Math.min(oldProgress + diff, 100);
      });
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, [onFinish]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #16213e 75%, #1a1a2e 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 25%, #667eea 50%, #c3cfe2 75%, #f5f7fa 100%)',
        transition: 'background 0.5s ease-in-out',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          animation: `${fadeIn} 0.6s ease-out`,
        }}
      >
        {/* Статичний логотип з прозорим фоном */}
        <Box
          component="img"
          src={customLogo || appLogo}
          alt="LUMYN"
          sx={{
            width: 140,
            height: 140,
            objectFit: 'contain',
            borderRadius: '28% ',
            filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.35))',
          }}
        />

        {/* Назва */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={(theme) => ({
              fontWeight: 700,
              ...(theme.palette.mode === 'dark' ? {
                background: 'linear-gradient(135deg, #5865F2 0%, #2AABEE 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              } : {
                color: '#ffffff',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }),
              mb: 0.5,
            })}
          >
            LUMYN
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            {language === 'en' ? 'Next-gen messenger' : 'Месенджер нового покоління'}
          </Typography>
        </Box>

        {/* Прогрес бар */}
        <Box sx={{ width: 280, px: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
                background: 'linear-gradient(90deg, #5865F2 0%, #2AABEE 100%)',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 1,
              color: 'text.secondary',
            }}
          >
            {progress < 30 && (language === 'en' ? 'Loading resources...' : 'Завантаження ресурсів...')}
            {progress >= 30 && progress < 60 && (language === 'en' ? 'Preparing interface...' : 'Підготовка інтерфейсу...')}
            {progress >= 60 && progress < 90 && (language === 'en' ? 'Connecting to servers...' : 'Підключення до серверів...')}
            {progress >= 90 && (language === 'en' ? 'Almost ready...' : 'Майже готово...')}
          </Typography>
        </Box>

      </Box>

      {/* Версія */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 24,
          color: 'text.secondary',
          opacity: 0.6,
        }}
      >
        v{appVersion} Beta
      </Typography>

      <style>
        {`
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default SplashScreen;
