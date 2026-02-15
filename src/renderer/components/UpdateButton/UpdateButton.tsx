import React from 'react';
import { Badge, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { SystemUpdateAlt as UpdateIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store/store';
import { t } from '@i18n/index';

const UpdateButton: React.FC = () => {
  const language = useSelector((state: RootState) => state.ui.language);
  const [status, setStatus] = React.useState<'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error'>('idle');

  React.useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.onUpdateStatus) return;

    const unsubscribe = api.onUpdateStatus((payload: any) => {
      if (payload?.status) {
        setStatus(payload.status);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleClick = async () => {
    const api = (window as any).electronAPI;
    if (!api) return;

    if (status === 'available') {
      await api.downloadUpdate?.();
      return;
    }

    if (status === 'downloaded') {
      await api.installUpdate?.();
      return;
    }

    await api.checkForUpdates?.();
  };

  const getTooltip = () => {
    switch (status) {
      case 'checking':
        return t('checkingUpdates');
      case 'available':
        return t('updateAvailable');
      case 'downloading':
        return t('downloadingUpdate');
      case 'downloaded':
        return t('restartToUpdate');
      case 'not-available':
        return t('noUpdates');
      case 'error':
        return t('updateError');
      default:
        return t('checkUpdates');
    }
  };

  const showDot = status === 'available' || status === 'downloaded';
  const isBusy = status === 'checking' || status === 'downloading';

  return (
    <Tooltip title={getTooltip()}>
      <span>
        <IconButton onClick={handleClick} disabled={isBusy} sx={{ color: 'text.secondary' }}>
          <Badge variant="dot" color="success" invisible={!showDot}>
            {isBusy ? <CircularProgress size={18} /> : <UpdateIcon />}
          </Badge>
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default UpdateButton;
