# LUMYN v1.0.11 - Bug Fixes and UX Improvements

## Overview

LUMYN v1.0.11 delivers critical bug fixes and user experience improvements for invite code management, time formatting synchronization, and complete localization support. This release focuses on stability and consistency across the application.

## Major Changes

### Invite Code Management System

**Fixed Copy-to-Clipboard Functionality**
- Replaced alert-based feedback with asynchronous clipboard API
- Implemented non-blocking toast notification for copy confirmation
- Resolves browser security restrictions on clipboard operations
- Notification automatically dismisses after 2 seconds

**Server Owner Code Customization**
- Added edit mode for invite codes in ServerSettingsDialog
- Code editing restricted to server owners only
- Maximum 10-character alphanumeric codes (auto-converted to uppercase)
- Save/Edit toggle button for UX clarity

**Enhanced Code Generation**
- New deterministic generation function for invite codes
- Replaces previous `inv_` prefix system with pure 10-character codes
- Improved uniqueness guarantees
- Case-insensitive code matching on backend

**Backend Validation**
- Implemented duplicate code prevention
- Case-insensitive invite code lookup
- Proper error handling for invalid or duplicate codes

### Time Format and Date Display

**Real-time Format Synchronization**
- Created new `timeFormatter.ts` utility module
- Implements reactive UI updates without page reload
- Centralizes all timestamp formatting logic

**Dynamic Format Application**
- 24-hour format: HH:mm or HH:mm:ss
- 12-hour format: h:mm a or h:mm:ss a
- Optional seconds display per user preference
- Settings read from localStorage with fallback defaults

**Event-Driven Updates**
- Custom `disgram-settings-changed` event for settings changes
- ChatWindow component listens for format changes
- Force re-render of time displays when settings update
- No manual page refresh requirement

### Localization Enhancements

**Complete Ukrainian Translation**
- Added 450+ Ukrainian translation strings
- Covers all UI labels, buttons, dialogs, and messages
- Maintains consistency across all components

**Language-Aware Components**
- All components properly respect language selection
- Translations sourced from centralized i18n module
- Support for English and Ukrainian included

## Technical Details

### Backend Changes (server/index.js)

New invite code generation function:
```javascript
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
```

Updated server join endpoint with case-insensitive matching and validation.

### Frontend Time Formatter (src/renderer/utils/timeFormatter.ts)

New utility module for consistent timestamp formatting across all components. Respects user-configured time format and seconds display. Includes proper error handling and validation for both Date objects and numeric timestamps.

### Component Updates

ServerSettingsDialog: Added customInviteCode and editingCode state variables. Implemented async clipboard operations with error handling. Added visual feedback for copy operations.

SettingsDialog: Dispatches `disgram-settings-changed` event on save. Ensures all listening components update their displayed times.

ChatWindow: Added useEffect listener for settings change events. Implements forceUpdateKey state for triggering re-renders. Maintains backward compatibility with existing time display logic.

## Bug Fixes

| Issue | Resolution | Impact |
|-------|-----------|--------|
| Copy button non-functional | Async clipboard API | Users can now share invite codes reliably |
| Time format requires reload | Event-driven updates | Settings apply immediately to all timestamps |
| Missing Ukrainian UI text | Complete translation coverage | Full Ukrainian language support |
| Invite codes too long | Limited to 10 characters | Easier to share and remember codes |
| Settings not persisted | localStorage integration | User preferences saved across sessions |
| No code duplicate detection | Backend validation | Prevents server conflicts |
| Clipboard alerts disruptive | Toast notifications | Non-intrusive user feedback |

## Files Modified

- server/index.js - Invite code generation and validation
- src/renderer/components/ServerSettingsDialog/ServerSettingsDialog.tsx - Code management UI
- src/renderer/components/SettingsDialog/SettingsDialog.tsx - Settings event dispatch
- src/renderer/components/ChatWindow/ChatWindow.tsx - Time format listener implementation
- src/renderer/utils/timeFormatter.ts - New global time formatting utility (NEW FILE)
- src/renderer/i18n/translations.ts - Complete Ukrainian localization

## Deployment

### Windows Installation
- Download: LUMYN Setup 1.0.11.exe (89.96 MB)
- Requirements: Windows 7 or later, .NET Framework 4.5+

### Cloud Infrastructure
- Backend: Railway.app (Production)
- Database: MongoDB Atlas (512MB Free Tier)
- Health Check: GET `/health` endpoint active
- Real-time Communication: Socket.IO WebSocket support

## Verification

Test the following to verify installation:

1. Copy invite code: Generate code, click Copy button, verify notification
2. Edit invite code: Access server settings, click Edit, change code
3. Time format: Settings > Time & Language, toggle 24-hour and seconds
4. Localization: Settings > Language, switch between English and Ukrainian
5. Messages: Send message, verify time displays per selected format

## Compatibility

- Electron: 28.3.3
- React: 18.x
- TypeScript: 5.x
- Node.js: 16+ (for backend)

## Performance Metrics

- Build size: 89.96 MB (Windows installer)
- Frontend chunks: 780.86 kB (gzip: 240.38 kB)
- No performance degradation from time format updates
- Event-driven architecture reduces unnecessary re-renders

## Known Limitations

- Invite codes limited to 10 characters (by design for usability)
- Time format changes apply to newly rendered messages (historical messages cached)
- Ukrainian translation covers UI only (user-generated content remains in original language)

## Contributors

- @user4032

## Installation & Quick Start

1. Download LUMYN Setup 1.0.11.exe
2. Run installer and follow setup wizard
3. Launch LUMYN
4. Create account or sign in
5. Add friends to start messaging

For detailed setup instructions, see QUICKSTART.md
