import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

// Telegram + Discord hybrid style - smooth, clean, modern
const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

export const BrutalChatIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      {...strokeProps}
    />
  </SvgIcon>
);

export const BrutalServersIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
      {...strokeProps}
    />
    <circle cx="9" cy="7" r="4" {...strokeProps} />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" {...strokeProps} />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" {...strokeProps} />
  </SvgIcon>
);

export const BrutalSettingsIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" {...strokeProps} />
    <path
      d="M12 1v6m0 6v10M1 12h6m6 0h10"
      {...strokeProps}
    />
    <path
      d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M19.78 4.22l-4.24 4.24m-5.08 5.08l-4.24 4.24"
      {...strokeProps}
    />
  </SvgIcon>
);

export const BrutalBellIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...strokeProps} />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" {...strokeProps} />
  </SvgIcon>
);

export const BrutalCallIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      {...strokeProps}
    />
  </SvgIcon>
);

export const BrutalVideoIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path
      d="M23 7l-7 5 7 5V7z"
      fill="currentColor"
      opacity="0.3"
    />
    <rect x="1" y="5" width="15" height="14" rx="2" {...strokeProps} />
    <path d="M16 10l7-3v10l-7-3" {...strokeProps} />
  </SvgIcon>
);

export const BrutalMoreIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
  </SvgIcon>
);

export const BrutalAttachIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path
      d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
      {...strokeProps}
    />
  </SvgIcon>
);

export const BrutalSendIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M22 2L11 13" {...strokeProps} />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" {...strokeProps} />
  </SvgIcon>
);

export const BrutalEmojiIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" {...strokeProps} />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" {...strokeProps} />
    <line x1="9" y1="9" x2="9.01" y2="9" {...strokeProps} />
    <line x1="15" y1="9" x2="15.01" y2="9" {...strokeProps} />
  </SvgIcon>
);
export const BrutalMessageIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    {/* Bubble background */}
    <path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"
      {...strokeProps}
    />
    {/* Message lines inside */}
    <path d="M7 9h10" {...strokeProps} />
    <path d="M7 13h5" {...strokeProps} />
  </SvgIcon>
);