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
} from '@mui/material';
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

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const language = useSelector((state: RootState) => state.ui.language);
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
  const showBrandPanel = mode === 'register';

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
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: showBrandPanel ? 'row' : 'column' },
          }}
        >
          <Box sx={{ p: 4, flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {t('authTitle')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {mode === 'verify' ? t('authHint') : ''}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {info && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {info}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label={t('email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                disabled={loading || mode === 'verify'}
                error={Boolean(email) && !emailValid}
                helperText={Boolean(email) && !emailValid ? t('invalidEmail') : ' '}
              />

          {mode !== 'verify' && (
            <TextField
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              disabled={loading}
              error={Boolean(password) && !passwordStrong}
              helperText={Boolean(password) && !passwordStrong ? t('passwordWeak') : ' '}
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
          )}

          {mode === 'register' && (
            <>
              <TextField
                label={t('displayName')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                fullWidth
                disabled={loading}
                error={Boolean(displayName) && !nameValid}
                helperText={Boolean(displayName) && !nameValid ? t('nameMin') : ' '}
              />
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
              />
            </>
          )}

          {mode === 'verify' && (
            <TextField
              label={t('verificationCode')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              fullWidth
              disabled={loading}
              autoFocus
              helperText={' '}
            />
          )}

          {mode === 'login' && (
            <Button
              variant="contained"
              onClick={handleLogin}
              disabled={loading || !email || !password || !emailValid || !passwordStrong}
            >
              {t('login')}
            </Button>
          )}

          {mode === 'register' && (
            <Button
              variant="contained"
              onClick={handleRegister}
              disabled={loading || !email || !password || !emailValid || !nameValid || !passwordStrong}
            >
              {t('sendCode')}
            </Button>
          )}

          {mode === 'verify' && (
            <Button variant="contained" onClick={handleVerify} disabled={loading || !code || !email}>
              {t('verify')}
            </Button>
          )}
        </Box>

            <Divider sx={{ my: 3 }} />

            {mode === 'login' && (
              <Button variant="text" onClick={() => setMode('register')} disabled={loading}>
                {t('register')}
              </Button>
            )}

            {mode === 'register' && (
              <Button variant="text" onClick={() => setMode('login')} disabled={loading}>
                {t('backToLogin')}
              </Button>
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
            <Box
              sx={{
                width: { xs: '100%', md: 320 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                p: 4,
                background: 'linear-gradient(160deg, #0b0f14 0%, #111827 45%, #0f172a 100%)',
                color: '#e5e7eb',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(260px circle at 20% 20%, rgba(34,197,94,0.25), transparent 60%), radial-gradient(260px circle at 80% 10%, rgba(99,102,241,0.25), transparent 60%)',
                  opacity: 0.9,
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
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 700, zIndex: 1 }}>
                LUMYN
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5f5', zIndex: 1, textAlign: 'center' }}>
                {language === 'en' ? 'Next-gen messenger' : 'Месенджер нового покоління'}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthScreen;
