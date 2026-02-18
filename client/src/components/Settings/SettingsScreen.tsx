import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';


import ProfileSettings from './ProfileSettings';
import ThemeSettings from './ThemeSettings';
import LanguageSettings from './LanguageSettings';



const tabLabels = [
  'Профіль',
  'Теми',
  'Мова',
];

export default function SettingsScreen() {
  const [tab, setTab] = React.useState(0);
  return (
    <Box sx={{ width: '100%', typography: 'body1', p: 2, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 2 }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 48,
          borderBottom: (theme) => `1.5px solid ${theme.palette.divider}`,
          mb: 2,
          '.MuiTabs-indicator': {
            height: 3,
            borderRadius: 2,
            background: (theme) => theme.palette.primary.main,
            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          },
        }}
      >
        {tabLabels.map((label, i) => (
          <Tab
            label={label}
            key={label}
            sx={{
              minHeight: 48,
              fontWeight: 600,
              fontSize: '1rem',
              color: 'text.secondary',
              letterSpacing: '-0.01em',
              px: 3,
              borderRadius: 2,
              transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
              '&.Mui-selected': {
                color: 'primary.main',
                bgcolor: 'action.selected',
              },
              '&:hover': {
                bgcolor: 'action.hover',
                color: 'primary.main',
              },
            }}
          />
        ))}
      </Tabs>
      <Box sx={{ mt: 2 }}>
        {tab === 0 && <ProfileSettings />}
        {tab === 1 && <ThemeSettings />}
        {tab === 2 && <LanguageSettings />}
      </Box>
    </Box>
  );
}
