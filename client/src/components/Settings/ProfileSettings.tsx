import React from 'react';
import { Box, TextField, Button, Avatar } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@store/store';
import { setUser } from '@store/slices/userSlice';

export default function ProfileSettings() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const [displayName, setDisplayName] = React.useState(currentUser?.displayName || '');
  const [customStatus, setCustomStatus] = React.useState(currentUser?.customStatus || '');
  const [bio, setBio] = React.useState(currentUser?.bio || '');

  React.useEffect(() => {
    setDisplayName(currentUser?.displayName || '');
    setCustomStatus(currentUser?.customStatus || '');
    setBio(currentUser?.bio || '');
  }, [currentUser]);

  const handleSave = () => {
    if (!currentUser) return;
    dispatch(setUser({
      ...currentUser,
      displayName,
      customStatus,
      bio,
    }));
  };

  return (
    <Box>
      <h2>Профіль</h2>
      <Avatar src={currentUser?.avatar} sx={{ width: 64, height: 64, mb: 2 }} />
      <TextField label="Ім'я" value={displayName} onChange={e => setDisplayName(e.target.value)} fullWidth sx={{ mb: 2 }} />
      <TextField label="Статус" value={customStatus} onChange={e => setCustomStatus(e.target.value)} fullWidth sx={{ mb: 2 }} />
      <TextField label="Біо" value={bio} onChange={e => setBio(e.target.value)} fullWidth multiline rows={2} sx={{ mb: 2 }} />
      <Button variant="contained" onClick={handleSave}>Зберегти</Button>
    </Box>
  );
}
