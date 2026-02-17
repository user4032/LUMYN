import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Fade,
  Collapse,
} from '@mui/material';
import { keyframes } from '@mui/system';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  registerAccount,
  resendCode,
  verifyCode,
  loginAccount,
  AuthUser,
} from '@/api/auth';
import appLogo from '@/assets/app-logo-preview.png';

interface AuthScreenProps {
  onAuthSuccess: (user: AuthUser, token: string, isRegistering?: boolean) => void;
}

type Mode = 'login' | 'register' | 'verify';

// Keyframes для анімації градієнту
const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;



const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const language = useSelector((state: RootState) => state.ui.language);
  const [mode, setMode] = React.useState<Mode>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [username, setUsername] = React.useState('');
  // Верифікаційний код більше не використовується
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  // resendTimer and setResendTimer removed
  const showBrandPanel = true;
  // resendTimer useEffect removed

  const resetAlerts = () => {
    setError('');
    setInfo('');
  };

  const handleLogin = async () => {
    resetAlerts();
    if (!email || !password) {
      setError(t('fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const response = await loginAccount(email, password);
      if (response.token && response.user) {
        onAuthSuccess(response.user, response.token, false);
      }
    } catch (err: any) {
      const message = err.message === 'Failed to fetch' ? t('serverUnavailable') : err.message;
      setError(message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // handleVerify removed

  // handleResend removed

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(800px circle at 10% 20%, rgba(34,197,94,0.2), transparent 55%), radial-gradient(900px circle at 90% 10%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(700px circle at 80% 90%, rgba(16,185,129,0.12), transparent 60%), linear-gradient(120deg, #0b0f14 0%, #0d1117 35%, #0f172a 100%)'
            : 'radial-gradient(800px circle at 10% 20%, rgba(16,185,129,0.18), transparent 55%), radial-gradient(900px circle at 90% 10%, rgba(79,70,229,0.18), transparent 60%), linear-gradient(120deg, #eef2ff 0%, #f8fafc 45%, #e2e8f0 100%)',
        transition: 'background 0.5s ease-in-out',
        p: { xs: 0.5, sm: 2, md: 3 },
      }}
    >
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: { xs: 370, sm: 420, md: showBrandPanel ? 860 : 420 },
            borderRadius: { xs: 2, sm: 3 },
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: { xs: 2, sm: 4 },
            m: { xs: 0.5, sm: 2 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: showBrandPanel ? 'row' : 'column' },
            }}
          >
            <Box sx={{ p: { xs: 1.5, sm: 3, md: 4 }, flex: 1 }}>
              <Fade in key={mode} timeout={400}>
                <Box>
                  <Typography 
                    variant="h6"
                    sx={{ 
                      fontWeight: 700, 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '1.2rem', sm: '1.5rem' },
                    }}
                  >
                    {t('authTitle')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: { xs: 1.5, sm: 3 }, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                    {mode === 'verify' ? t('authHint') : ''}
                  </Typography>
                </Box>
              </Fade>

              {error && (
                <Collapse in={Boolean(error)}>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                </Collapse>
              )}
              {info && (
                <Collapse in={Boolean(info)}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {info}
                  </Alert>
                </Collapse>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.2, sm: 2 } }}>
                <Fade in timeout={500}>
                  <TextField
                    label={t('email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    size="small"
                    disabled={loading || mode === 'verify'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                        '&.Mui-focused': {
                          transform: 'translateY(-2px)',
                        },
                      },
                    }}
                  />
                </Fade>

                {mode !== 'verify' && (
                  <Fade in timeout={600}>
                    <TextField
                      label={t('password')}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      fullWidth
                      size="small"
                      disabled={loading}
                      // error and helperText removed for password
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                          },
                          '&.Mui-focused': {
                            transform: 'translateY(-2px)',
                          },
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              onClick={() => setShowPassword((prev) => !prev)}
                              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Fade>
                )}

                {mode === 'register' && (
                  <>
                    <Fade in timeout={700}>
                      <TextField
                        label={t('displayName')}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        fullWidth
                        size="small"
                        disabled={loading}
                        // error and helperText removed for displayName
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                            },
                            '&.Mui-focused': {
                              transform: 'translateY(-2px)',
                            },
                          },
                        }}
                      />
                    </Fade>
                    <Fade in timeout={800}>
                      <TextField
                        label={t('usernameLabel')}
                        value={username}
                        onChange={(e) => {
                          const filtered = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '');
                          setUsername(filtered);
                        }}
                        fullWidth
                        size="small"
                        disabled={loading}
                        // error and helperText removed for username
                        helperText={t('usernameHint')}
                        placeholder="john_doe"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                            },
                            '&.Mui-focused': {
                              transform: 'translateY(-2px)',
                            },
                          },
                        }}
                      />
                    </Fade>
                  </>
                )}

                {/* Верифікаційне поле видалено */}

                {mode === 'login' && (
                  <Fade in timeout={600}>
                    <Button
                      variant="contained"
                      onClick={handleLogin}
                      disabled={loading || !email || !password}
                      sx={{
                        py: { xs: 1, sm: 1.5 },
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        transition: 'all 0.3s ease',
                        borderRadius: 2,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                        },
                        '&:active': {
                          transform: 'translateY(0px)',
                        },
                      }}
                    >
                      {t('login')}
                    </Button>
                  </Fade>
                )}

                {mode === 'register' && (
                  <Fade in timeout={900}>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        resetAlerts();
                        if (!email || !password || !displayName || !username) {
                          setError(t('fillAllFields'));
                          return;
                        }
                        setLoading(true);
                        try {
                          const response = await registerAccount(email, password, displayName, username);
                          if (response.token && response.user) {
                            onAuthSuccess(response.user, response.token, true);
                          } else {
                            setInfo(t('authHint'));
                          }
                        } catch (err: any) {
                          const message = err.message === 'Failed to fetch' ? t('serverUnavailable') : err.message;
                          setError(message || 'Registration failed');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !email || !password || !displayName || !username}
                      sx={{
                        py: 1.5,
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                        },
                        '&:active': {
                          transform: 'translateY(0px)',
                        },
                      }}
                    >
                      {t('sendCode')}
                    </Button>
                  </Fade>
                )}

                {/* Кнопка підтвердження коду видалена */}
              </Box>

              <Divider sx={{ my: 3 }} />

              {mode === 'login' && (
                <Fade in timeout={700}>
                  <Button 
                    variant="text" 
                    onClick={() => setMode('register')} 
                    disabled={loading}
                    sx={{
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateX(5px)',
                      },
                    }}
                  >
                    {t('register')}
                  </Button>
                </Fade>
              )}

              {mode === 'register' && (
                <Fade in timeout={700}>
                  <Button 
                    variant="text" 
                    onClick={() => setMode('login')} 
                    disabled={loading}
                    sx={{
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateX(5px)',
                      },
                    }}
                  >
                    {t('backToLogin')}
                  </Button>
                </Fade>
              )}

              {/* Кнопки для повторної відправки коду видалені */}
            </Box>

            {showBrandPanel && (
              <Fade in timeout={800}>
                <Box
                  sx={{
                    width: { xs: '100%', md: 260 },
                    minWidth: { xs: '100%', md: 200 },
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    p: { xs: 1.5, sm: 3, md: 4 },
                    background: mode === 'register' 
                      ? 'linear-gradient(-45deg, #0b0f14, #111827, #1e293b, #0f172a)'
                      : 'linear-gradient(-45deg, #1e293b, #0f172a, #0b0f14, #111827)',
                    backgroundSize: '400% 400%',
                    animation: `${gradientShift} 15s ease infinite`,
                    color: '#e5e7eb',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.5s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: mode === 'register'
                        ? 'radial-gradient(260px circle at 20% 20%, rgba(34,197,94,0.3), transparent 60%), radial-gradient(260px circle at 80% 10%, rgba(99,102,241,0.3), transparent 60%)'
                        : 'radial-gradient(260px circle at 80% 80%, rgba(59,130,246,0.3), transparent 60%), radial-gradient(260px circle at 20% 90%, rgba(168,85,247,0.3), transparent 60%)',
                      opacity: 0.9,
                      animation: `${gradientShift} 10s ease infinite`,
                      transition: 'all 0.5s ease',
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={appLogo}
                    alt="LUMYN"
                    sx={{
                      width: { xs: 80, sm: 100, md: 120 },
                      height: { xs: 80, sm: 100, md: 120 },
                      objectFit: 'contain',
                      zIndex: 1,
                      filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.35))',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      zIndex: 1,
                      fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    LUMYN
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#cbd5f5', 
                      zIndex: 1, 
                      textAlign: 'center',
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {language === 'en' ? 'Next-gen messenger' : 'Месенджер нового покоління'}
                  </Typography>
                </Box>
              </Fade>
            )}
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};

export default AuthScreen;
