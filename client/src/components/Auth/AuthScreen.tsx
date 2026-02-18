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
        background: (theme) => theme.palette.background.default,
        p: { xs: 0.5, sm: 2, md: 3 },
      }}
    >
      <Fade in timeout={600}>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: { xs: 370, sm: 420 },
            borderRadius: 10,
            bgcolor: 'background.paper',
            overflow: 'hidden',
            boxShadow: 'none',
            border: 'none',
            m: { xs: 0.5, sm: 2 },
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: showBrandPanel ? 'row' : 'column' },
            }}
          >
            <Box sx={{ width: '100%', maxWidth: 340, mx: 'auto', p: 0, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Box component="img" src={appLogo} alt="LUMYN" sx={{ width: 44, height: 44, mb: 1, filter: 'none', borderRadius: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 0.5, letterSpacing: '-0.01em' }}>LUMYN</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.95rem', mb: 0 }}>{t('authTitle')}</Typography>
              </Box>

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

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, width: '100%' }}>
                <TextField
                  label={t('email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  size="small"
                  disabled={loading || mode === 'verify'}
                  variant="outlined"
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      background: 'transparent',
                      borderRadius: 2,
                      boxShadow: 'none',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'border-color 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused': {
                        borderColor: 'primary.main',
                      },
                    },
                  }}
                />

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
                      variant="outlined"
                      sx={{
                        mb: 1,
                        '& .MuiOutlinedInput-root': {
                          background: 'transparent',
                          borderRadius: 2,
                          boxShadow: 'none',
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'border-color 0.2s',
                          '&:hover': {
                            borderColor: 'primary.main',
                          },
                          '&.Mui-focused': {
                            borderColor: 'primary.main',
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
                              size="small"
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
                        variant="outlined"
                        sx={{
                          mb: 1,
                          '& .MuiOutlinedInput-root': {
                            background: 'transparent',
                            borderRadius: 2,
                            boxShadow: 'none',
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'border-color 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                            },
                            '&.Mui-focused': {
                              borderColor: 'primary.main',
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
                        variant="outlined"
                        helperText={t('usernameHint')}
                        placeholder="john_doe"
                        sx={{
                          mb: 1,
                          '& .MuiOutlinedInput-root': {
                            background: 'transparent',
                            borderRadius: 2,
                            boxShadow: 'none',
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'border-color 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                            },
                            '&.Mui-focused': {
                              borderColor: 'primary.main',
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
                        py: 1.1,
                        fontWeight: 600,
                        fontSize: '1rem',
                        borderRadius: 2,
                        boxShadow: 'none',
                        textTransform: 'none',
                        background: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          background: 'primary.dark',
                          boxShadow: 'none',
                        },
                        mb: 1.5,
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
                        py: 1.1,
                        fontWeight: 600,
                        fontSize: '1rem',
                        borderRadius: 2,
                        boxShadow: 'none',
                        textTransform: 'none',
                        background: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          background: 'primary.dark',
                          boxShadow: 'none',
                        },
                        mb: 1.5,
                      }}
                    >
                      {t('sendCode')}
                    </Button>
                  </Fade>
                )}

                {/* Кнопка підтвердження коду видалена */}
              </Box>

              <Divider sx={{ my: 2, borderColor: 'divider' }} />

              {mode === 'login' && (
                <Button 
                  variant="text" 
                  onClick={() => setMode('register')} 
                  disabled={loading}
                  sx={{
                    color: 'secondary.main',
                    fontWeight: 500,
                    fontSize: '0.97rem',
                    textTransform: 'none',
                    letterSpacing: '-0.01em',
                    p: 0,
                    minHeight: 0,
                    minWidth: 0,
                  }}
                >
                  {t('register')}
                </Button>
              )}

              {mode === 'register' && (
                <Button 
                  variant="text" 
                  onClick={() => setMode('login')} 
                  disabled={loading}
                  sx={{
                    color: 'secondary.main',
                    fontWeight: 500,
                    fontSize: '0.97rem',
                    textTransform: 'none',
                    letterSpacing: '-0.01em',
                    p: 0,
                    minHeight: 0,
                    minWidth: 0,
                  }}
                >
                  {t('backToLogin')}
                </Button>
              )}

              {/* Кнопки для повторної відправки коду видалені */}
            </Box>

            {/* No side brand panel for minimalism */}
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};

export default AuthScreen;
