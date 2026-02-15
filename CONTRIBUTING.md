# Contributing to LUMYN

Thank you for your interest in contributing to LUMYN Messenger! This guide will help you get started.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Style Guide](#style-guide)
8. [Project Structure](#project-structure)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct:

- **Be respectful** - Treat everyone with respect and dignity
- **Be inclusive** - Welcome all contributions and perspectives
- **Be professional** - Keep discussions professional and constructive
- **Report issues** - Use private channels to report Code of Conduct violations

---

## Getting Started

### Fork & Clone

```bash
# 1. Fork repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/lumyn.git
cd lumyn

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL-OWNER/lumyn.git

# 4. Create feature branch
git checkout -b feature/your-feature-name
```

### Before Starting

- Create an issue to discuss your feature/fix
- Wait for approval from maintainers
- Check existing issues/PRs for duplicates

---

## Development Setup

### Prerequisites

```bash
# Check Node.js version (16+)
node --version

# Check npm version (8+)
npm --version

# Check MongoDB is running
mongod --version
```

### Install & Run

```bash
# Install dependencies
npm install

# Create .env from template
cp .env.example .env

# Start development server
npm run dev

# In another terminal, start backend
npm run dev:server

# In another terminal (optional), start Electron
npm run dev:electron
```

### Available Commands

```bash
# Development
npm run dev              # Start all dev services
npm run dev:react       # Frontend only
npm run dev:server      # Backend only
npm run dev:electron    # Electron only

# Building
npm run build           # Full build
npm run build:win       # Build Windows
npm run build:mac       # Build macOS
npm run build:linux     # Build Linux

# Testing & Linting
npm run test            # Run tests
npm run lint            # Check linting
npm run format          # Format code

# Production
npm start              # Start production server
npm run prod          # Production build + start
```

---

## Making Changes

### Branch Naming

Use descriptive branch names:

```bash
# Features
git checkout -b feature/user-profile-editing
git checkout -b feature/add-voice-messages

# Bug fixes
git checkout -b fix/message-not-sending
git checkout -b fix/memory-leak-in-chat

# Documentation
git checkout -b docs/add-api-documentation

# Refactoring
git checkout -b refactor/simplify-auth-flow
```

### Commit Messages

Write clear, descriptive commit messages:

```bash
# Good
git commit -m "feat: add user profile editing feature"
git commit -m "fix: prevent duplicate messages in chat"
git commit -m "docs: update installation guide"

# Bad
git commit -m "update"
git commit -m "fix stuff"
git commit -m "WIP"
```

### Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code refactoring without feature changes
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Dependency updates, build scripts

### File Structure

When adding features, follow the existing structure:

```
src/
├── renderer/
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatWindow.tsx      # Main component
│   │   │   ├── ChatHeader.tsx      # Sub-component
│   │   │   ├── MessageList.tsx     # Sub-component
│   │   │   └── ChatWindow.module.css # Styles
│   │   └── [Component Name]/
│   ├── pages/
│   │   ├── ChatPage.tsx
│   │   └── LoginPage.tsx
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   └── chatSlice.ts
│   │   └── index.ts
│   └── types/
│       └── index.ts
├── server/
│   ├── routes/
│   │   ├── auth.ts
│   │   └── chats.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Chat.ts
│   │   └── Message.ts
│   └── index.ts
└── shared/
    └── types.ts
```

---

## Testing

### Writing Tests

```typescript
// tests/components/Chat.test.ts
import { render, screen } from '@testing-library/react';
import Chat from '@components/Chat/Chat';

describe('Chat Component', () => {
  test('renders chat messages', () => {
    render(<Chat chatId="123" />);
    expect(screen.getByText(/messages/i)).toBeInTheDocument();
  });

  test('sends message on enter', () => {
    render(<Chat chatId="123" />);
    const input = screen.getByRole('textbox');
    // Test implementation
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific file
npm test -- ChatWindow.test.ts
```

### Test Coverage

- Aim for 80%+ coverage
- Focus on critical paths
- Test edge cases
- Mock external dependencies

---

## Submitting Changes

### Before Pushing

```bash
# 1. Format code
npm run format

# 2. Check linting
npm run lint

# 3. Run tests
npm test

# 4. Build locally
npm run build

# 5. Update documentation
# - Update README.md if needed
# - Add CHANGELOG entry
# - Update type definitions if changed

# 6. Check branch status
git status
git log --oneline -5
```

### Push to Your Fork

```bash
# Fetch latest changes
git fetch upstream

# Rebase on main
git rebase upstream/main

# Push to your fork
git push origin feature/your-feature-name
```

### Create Pull Request

1. Go to GitHub and create Pull Request
2. Use descriptive title: `feat: add user profile editing`
3. Reference issue: `Fixes #123`
4. Fill out PR template completely
5. Ensure CI checks pass

### PR Description Template

```markdown
## Description
Brief description of changes

## Related Issue
Fixes #(issue number)

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how this was tested

## Screenshots (if applicable)
Add relevant screenshots

## Checklist
- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] All tests pass locally
```

---

## Style Guide

### TypeScript

```typescript
// Use strict typing
const getUserById = (id: string): Promise<User> => {
  // implementation
};

// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
}

// Use enums for constants
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

// Use arrow functions
const handleClick = () => {
  // implementation
};

// Destructure props
const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, messages }) => {
  // implementation
};
```

### React Components

```typescript
// Use functional components
const ChatComponent: React.FC<ChatProps> = ({ chatId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    // Side effects
  }, [chatId]);

  return (
    <div className="chat">
      {/* JSX */}
    </div>
  );
};

export default ChatComponent;
```

### CSS/Styling

```css
/* Use BEM naming convention */
.chat-window { }
.chat-window__header { }
.chat-window__header--active { }
.chat-window__message { }

/* Group related properties */
.chat {
  /* Box model */
  padding: 16px;
  margin: 0;
  border: 1px solid #ddd;
  
  /* Typography */
  font-size: 14px;
  line-height: 1.5;
  
  /* Visual */
  background-color: #fff;
  color: #333;
  
  /* Interactions */
  transition: all 0.3s ease;
}

/* Mobile first approach */
@media (max-width: 768px) {
  .chat {
    padding: 8px;
  }
}
```

### Naming Conventions

```typescript
// Constants - UPPER_SNAKE_CASE
const MAX_MESSAGE_LENGTH = 5000;
const API_TIMEOUT = 30000;

// Variables/Functions - camelCase
let currentUser: User;
const handleMessageSend = () => {};

// Classes/Components - PascalCase
class UserService {}
const ChatWindow = () => {};

// Private fields - prefix with underscore
private _internalState: State;
```

---

## Project Structure Deep Dive

### Frontend (React + Vite)

```
src/renderer/
├── components/          # Reusable UI components
│   ├── Chat/           # Chat-related components
│   ├── Auth/           # Authentication components
│   ├── User/           # User-related components
│   └── ...
├── pages/              # Full page components (routes)
├── store/              # Redux store
│   ├── slices/         # Redux slices
│   └── index.ts        # Store configuration
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization
├── types/              # TypeScript definitions
├── services/           # API services
├── utils/              # Utility functions
├── styles/             # Global styles
└── App.tsx             # Root component
```

### Backend (Node.js + Express)

```
server/
├── routes/             # API route handlers
├── models/             # Mongoose schemas
├── controllers/        # Business logic
├── middleware/         # Express middleware
├── services/           # Business logic services
├── utils/              # Utility functions
├── sockets/            # Socket.IO handlers
└── index.ts            # Server entry point
```

### Main Process (Electron)

```
src/main/
├── windows/            # Window management
├── menu/               # Application menu
├── ipc/                # IPC handlers
└── index.ts            # Main process entry
```

---

## Common Tasks

### Adding a New Feature

1. Create issue describing the feature
2. Wait for approval
3. Create feature branch
4. Implement feature following the guide
5. Add/update tests
6. Update documentation
7. Submit PR with description

### Creating a New Component

```typescript
// src/renderer/components/NewComponent/NewComponent.tsx
import React from 'react';
import styles from './NewComponent.module.css';

interface NewComponentProps {
  title: string;
  onClose?: () => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ title, onClose }) => {
  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      {/* Implementation */}
    </div>
  );
};

export default NewComponent;
```

### Adding a New API Endpoint

```typescript
// server/routes/newFeature.ts
import express, { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/feature
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    // Implementation
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

## Getting Help

- **GitHub Issues** - Ask questions, report bugs
- **GitHub Discussions** - General discussion
- **Email** - Contact maintainers directly
- **Documentation** - Check README, guides

---

## Recognition

Contributors are recognized in:
- GitHub contributors page
- CONTRIBUTORS.md file
- Release notes

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to LUMYN! 🚀
