# Changelog

All notable changes to this project will be documented in this file.

## [1.0.12] - 2026-02-15

### 🏷️ Release
- Official release v1.0.12
- Tagged for deployment and distribution

## [1.0.0] - 2026-02-15

### ✨ New Features

#### Messaging Features
- **Notifications System** - Real-time notifications with MongoDB persistence
- **User Blocking** - Block and unblock users, manage blocked users list
- **Chat Settings** - Mute notifications, mark as favorite, archive chats
- **Read Receipts** - Track message delivery and read status with visual indicators
- **Message Forwarding** - Forward messages to different chats and channels
- **Disappearing Messages** - Auto-expiring messages with configurable TTL (1 hour to 7 days)
- **User Presence & Status** - Real-time online/offline status with multiple status modes
- **Emoji Reactions** - Expanded emoji picker with 40+ smileys, gestures, hearts, and objects
- **Rich Text Formatting** - Support for bold, italic, code, and code blocks
- **Typing Indicators** - Animated typing indicators showing when users are composing

#### Components & UI
- `NotificationsPanel` - Dashboard for managing notifications
- `MessageContextMenu` - Context menu for message actions (copy, reply, react, forward, etc.)
- `ChatSettingsDialog` - Configure chat preferences and personalization
- `UserBlockDialog` - Manage blocked users
- `ForwardMessageDialog` - Forward messages to chats and channels
- `MessageIndicators` - Display read receipts and typing indicators
- `UserPresence` - Show user status with color-coded badges
- `EmojiReactionPicker` - Organized emoji picker with tabs
- `FavoriteChatPanel` - Quick access to favorite chats

#### Backend APIs
- **POST /users/:userId/block** - Block a user
- **DELETE /users/:userId/block** - Unblock a user
- **GET /users/blocked** - List all blocked users
- **GET /chats/:chatId/settings** - Get user's chat settings
- **PATCH /chats/:chatId/settings** - Update chat settings (mute, favorite, archive, etc.)
- **GET /chats/favorites** - Get list of favorite chats
- **POST /messages/:messageId/read** - Mark message as read
- **POST /chats/:chatId/read** - Mark all chat messages as read
- **POST /messages/:messageId/forward** - Forward message to another chat
- **POST /messages/:messageId/expire** - Set auto-delete timer for message

#### Database Models
- **Block** - User blocking relationships with timestamps
- **ChatSettings** - Per-user chat preferences (mute, favorite, archive, notifications, customization)
- **Message** (Updated) - Added fields for read receipts, expiration, forwarding, formatting, translations

### 🔧 Technical Improvements
- Implemented i18n locale management system
- Added Socket.IO real-time events for notifications and typing
- MongoDB TTL indexes for automatic message expiration
- Comprehensive translation support (Ukrainian + English)
- Improved error handling and validation

### 📚 Localization
- **24+ translation keys** added for all new features
- Full support for Ukrainian and English
- Fallback language system for missing translations

### 🐛 Frontend Fixes
- Fixed all TypeScript compilation errors
- Removed react-i18next dependency in favor of custom i18n solution
- Fixed icon imports (replaced non-existent Material-UI icons)
- Fixed component variable shadowing in ForwardMessageDialog
- Updated all translation function calls to use single-parameter API

### 🚀 Performance
- Optimized Socket.IO event handling
- TTL indexes for efficient message cleanup

---

## [0.1.5] - Previous Release
- Initial feature set with basic messaging
- User authentication and profiles
- Server and channel management
- Friend system

---

## Installation & Setup

### Prerequisites
- Node.js 16+
- MongoDB (local or Atlas)
- Electron (for desktop app)

### Quick Start
```bash
# Clone repository
git clone https://github.com/yourusername/lumyn.git
cd lumyn

# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build
```

### Configuration
See [SETUP.md](SETUP.md) for detailed environment setup instructions.

---

## Documentation
- [README.md](README.md) - Project overview
- [QUICKSTART.md](QUICKSTART.md) - Getting started guide
- [SETUP.md](SETUP.md) - Environment setup
- [MONGODB_SETUP.md](MONGODB_SETUP.md) - MongoDB configuration
- [ROADMAP.md](ROADMAP.md) - Future plans

---

## Contributors
- [@yourname](https://github.com/yourname) - Core development

---

## License
MIT - See LICENSE file for details

---

## Support
For issues and feature requests, please open an issue on [GitHub Issues](https://github.com/yourusername/lumyn/issues)
