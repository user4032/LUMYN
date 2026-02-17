import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';

interface ReadReceipt {
  userId: string;
  readAt: Date;
}

interface ReadReceiptIndicatorProps {
  readBy?: ReadReceipt[];
  senderId: string;
  currentUserId: string;
}

export const ReadReceiptIndicator: React.FC<ReadReceiptIndicatorProps> = ({
  readBy = [],
  senderId,
  currentUserId,
}) => {
  // Only show read receipts for messages sent by current user
  if (senderId !== currentUserId) {
    return null;
  }

  const hasBeenRead = readBy.length > 0;

  return (
    <Tooltip
      title={
        readBy.length > 0
          ? `Read by ${readBy.length} user(s)`
          : 'Delivered'
      }
      placement="top"
    >
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
        {hasBeenRead ? (
          <DoneAllIcon sx={{ fontSize: 14, color: '#0084FF' }} />
        ) : (
          <DoneIcon sx={{ fontSize: 14, color: 'textSecondary' }} />
        )}
      </Box>
    </Tooltip>
  );
};

interface TypingIndicatorProps {
  typingUsers: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        ml: 2,
        py: 0.5,
        px: 1,
        bgcolor: 'action.hover',
        borderRadius: 2,
        maxWidth: 'fit-content',
      }}
    >
      <Style.TypingDot
        sx={{
          animation: 'typing 1.4s infinite',
          animationDelay: '0s',
        }}
      />
      <Style.TypingDot
        sx={{
          animation: 'typing 1.4s infinite',
          animationDelay: '0.2s',
        }}
      />
      <Style.TypingDot
        sx={{
          animation: 'typing 1.4s infinite',
          animationDelay: '0.4s',
        }}
      />
      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

const Style = {
  TypingDot: Box,
};
