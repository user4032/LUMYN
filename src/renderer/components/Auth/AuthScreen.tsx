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
} from '@/renderer/api/auth';
import appLogo from '../../assets/app-logo-preview.png';

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

const floatAnimation = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = React.useState<Mode>('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);
  const showBrandPanel = mode !== 'verify';

  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const nameValid = displayName.trim().length >= 5;
  const usernameValid = username.trim().length >= 4 && /^[a-zA-Z0-9._-]+$/.test(username.trim());
  const passwordStrong = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);

  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const resetAlerts = () => {
    setError('');
    setInfo('');
  };

  const handleLogin = async () => {
    resetAlerts();
    if (!emailValid) {
      setError(t('invalidEmail'));
      return;
    }
    if (!passwordStrong) {
      setError(t('passwordWeak'));
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

  const handleRegister = async () => {
    resetAlerts();
    if (!emailValid) {
      setError(t('invalidEmail'));
      return;
    }
    if (!nameValid) {
      setError(t('nameMin'));
      return;
    }
    if (!usernameValid) {
      setError(t('usernameInvalidChars'));
      return;
    }
    if (!passwordStrong) {
      setError(t('passwordWeak'));
      return;
    }
    setLoading(true);
    try {
      const response = await registerAccount(email, password, displayName, username.trim());
      if (response.needsVerification) {
        setMode('verify');
        const devInfo = response.devCode ? ` ${t('devCode')}: ${response.devCode}` : '';
        setInfo(`${t('authHint')}${devInfo}`);
        setResendTimer(60);
        // Запам'ятовуємо, що це реєстрація
        (window as any).__isRegistering = true;
      }
    } catch (err: any) {
      const message = err.message === 'Failed to fetch' ? t('serverUnavailable') : err.message;
      if (message === 'Username already taken') {
        setError(t('usernameTaken'));
      } else {
        setError(message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    resetAlerts();
    setLoading(true);
    try {
      await verifyCode(email, code);
      setInfo(t('authHint'));
      // Автоматично логінимось після підтвердження
      const isRegistering = (window as any).__isRegistering || false;
      delete (window as any).__isRegistering;
      const response = await loginAccount(email, password);
      if (response.token && response.user) {
        onAuthSuccess(response.user, response.token, isRegistering);
      }
    } catch (err: any) {
      const message = err.message === 'Failed to fetch' ? t('serverUnavailable') : err.message;
      setError(message || 'Verification failed');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    resetAlerts();
    setLoading(true);
    try {
      const response = await resendCode(email);
      const devInfo = response.devCode ? ` ${t('devCode')}: ${response.devCode}` : '';
      setInfo(`${t('authHint')}${devInfo}`);
      setResendTimer(60);
    } catch (err: any) {
      const message = err.message === 'Failed to fetch' ? t('serverUnavailable') : err.message;
      setError(message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

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
        p: 3,
      }}
    >
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: showBrandPanel ? 860 : 420,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: showBrandPanel ? 'row' : 'column' },
            }}
          >
            <Box sx={{ p: 4, flex: 1 }}>
              <Fade in key={mode} timeout={400}>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      animation: `${floatAnimation} 3s ease-in-out infinite`,
                    }}
                  >
                    {t('authTitle')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
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

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Fade in timeout={500}>
                  <TextField
                    label={t('email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    disabled={loading || mode === 'verify'}
                    error={Boolean(email) && !emailValid}
                    helperText={Boolean(email) && !emailValid ? t('invalidEmail') : ' '}
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
                      disabled={loading}
                      error={Boolean(password) && !passwordStrong}
                      helperText={Boolean(password) && !passwordStrong ? t('passwordWeak') : ' '}
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
                        disabled={loading}
                        error={Boolean(displayName) && !nameValid}
                        helperText={Boolean(displayName) && !nameValid ? t('nameMin') : ' '}
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
                        disabled={loading}
                        error={Boolean(username) && !usernameValid}
                        helperText={
                          Boolean(username) && !usernameValid
                            ? t('usernameInvalidChars')
                            : t('usernameHint')
                        }
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

                {mode === 'verify' && (
                  <Fade in timeout={500}>
                    <TextField
                      label={t('verificationCode')}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      fullWidth
                      disabled={loading}
                      autoFocus
                      helperText={' '}
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
                )}

                {mode === 'login' && (
                  <Fade in timeout={600}>
                    <Button
                      variant="contained"
                      onClick={handleLogin}
                      disabled={loading || !email || !password || !emailValid || !passwordStrong}
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
                      {t('login')}
                    </Button>
                  </Fade>
                )}

                {mode === 'register' && (
                  <Fade in timeout={900}>
                    <Button
                      variant="contained"
                      onClick={handleRegister}
                      disabled={loading || !email || !password || !emailValid || !nameValid || !passwordStrong}
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

                {mode === 'verify' && (
                  <Fade in timeout={600}>
                    <Button 
                      variant="contained" 
                      onClick={handleVerify} 
                      disabled={loading || !code || !email}
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
                      {t('verify')}
                    </Button>
                  </Fade>
                )}
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

              {mode === 'verify' && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="text" onClick={() => setMode('login')} disabled={loading}>
                    {t('backToLogin')}
                  </Button>
                  <Button
                    variant="text"
                    onClick={handleResend}
                    disabled={loading || !email || resendTimer > 0}
                  >
                    {resendTimer > 0 ? `${t('resendCode')} (${resendTimer})` : t('resendCode')}
                  </Button>
                </Box>
              )}
            </Box>

            {showBrandPanel && (
              <Fade in timeout={800}>
                <Box
                  sx={{
                    width: { xs: '100%', md: 320 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    p: 4,
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
                      width: 120,
                      height: 120,
                      objectFit: 'contain',
                      zIndex: 1,
                      filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.35))',
                      animation: `${floatAnimation} 4s ease-in-out infinite`,
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      zIndex: 1,
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
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {t('nextGenMessenger')}
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
