# LUMYN Messenger - Setup & Installation Guide

## Quick Installation

Choose your operating system below for the fastest setup:

### 🪟 Windows Users

#### Option 1: Batch File (Simplest)
```bash
setup.bat
```
Double-click `setup.bat` and follow the on-screen prompts.

#### Option 2: PowerShell Script (Advanced)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

#### Option 3: Manual Installation
```bash
npm install
npm run dev
```

---

### 🍎 macOS Users

```bash
chmod +x setup.sh
./setup.sh
```

---

### 🐧 Linux Users

```bash
chmod +x setup.sh
./setup.sh
```

---

## System Requirements

### Minimum Requirements
- **Node.js**: 16.0.0 or higher
- **npm**: 8.0.0 or higher
- **MongoDB**: 4.4+ (local or MongoDB Atlas)
- **RAM**: 4GB minimum
- **Disk Space**: 2GB minimum

### Recommended
- **Node.js**: 18.x or higher
- **MongoDB**: 5.0 or higher
- **RAM**: 8GB
- **Disk Space**: 5GB

---

## Prerequisites Check

Before running the installer, verify you have:

### 1. Node.js & npm
```bash
node --version
npm --version
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### 2. MongoDB
```bash
mongod --version
```

**Option A: Local MongoDB**
- Download from [mongodb.com](https://www.mongodb.com/try/download/community)
- Follow [official installation guide](https://docs.mongodb.com/manual/installation/)

**Option B: MongoDB Atlas (Cloud)**
- Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Get connection string

---

## Installation Steps

### Step 1: Check Prerequisites
Ensure all system requirements are met (see above).

### Step 2: Run Setup Script
Choose your method:
- **Windows**: Double-click `setup.bat` or run `.\setup.ps1`
- **macOS/Linux**: Run `./setup.sh`

### Step 3: Configure Environment
The setup script will create `.env` file automatically from `.env.example`.

Edit `.env` if needed:
```env
# Server
PORT=4777
MONGODB_URI=mongodb://localhost:27017/lumyn

# Frontend
VITE_API_URL=http://localhost:4777

# Auth
JWT_SECRET=your-secret-key-here
```

### Step 4: Start MongoDB
Open a new terminal and start MongoDB:

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:**
- Connection already configured in `.env`

### Step 5: Start Development Server
```bash
npm run dev
```

The application will start on:
- **Frontend**: http://localhost:5173
- **Electron**: Will launch automatically
- **Backend**: http://localhost:4777

---

## Troubleshooting

### Issue: "Node.js not found"
**Solution**: Install Node.js from [nodejs.org](https://nodejs.org/)

### Issue: "MongoDB connection failed"
**Solutions**:
1. Ensure MongoDB is running: `mongod`
2. Check MongoDB URI in `.env`
3. Use MongoDB Atlas if local installation fails

### Issue: Port 5173 already in use
**Solution**: Change port in `vite.config.ts`:
```typescript
server: {
  port: 5174, // Change to any available port
},
```

### Issue: Installation permission denied (Linux/macOS)
**Solution**: Make script executable:
```bash
chmod +x setup.sh
./setup.sh
```

### Issue: PowerShell execution policy blocked (Windows)
**Solution**: Run as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup.ps1
```

---

## Development Commands

```bash
# Start development environment
npm run dev

# Start only frontend (React)
npm run dev:react

# Start only backend (Node.js)
npm run dev:server

# Start only Electron
npm run dev:electron

# Build for production
npm run build

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux

# Run linter
npm run lint

# Format code
npm run format
```

---

## Production Build

### Building for Distribution
```bash
npm run build
```

This will create:
- **dist/renderer/** - React build
- **release/** - Electron installers

### Building Platform-Specific
```bash
# Windows installer
npm run build:win

# macOS installer
npm run build:mac

# Linux installer
npm run build:linux
```

---

## Environment Variables

### Required (.env)
```env
PORT=4777
MONGODB_URI=mongodb://localhost:27017/lumyn
VITE_API_URL=http://localhost:4777
JWT_SECRET=your-secret-key-here
```

### Optional
```env
NODE_ENV=development
DEBUG=true
```

Complete list in `.env.example`

---

## Database Setup

### Local MongoDB

**Windows:**
1. Install from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run: `mongod`
3. Default connection: `mongodb://localhost:27017/lumyn`

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### MongoDB Atlas (Recommended for Cloud)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create account and cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

---

## First Steps After Installation

1. **Start MongoDB** (if using local)
   ```bash
   mongod
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   - http://localhost:5173
   - Or Electron app will open automatically

4. **Create Account**
   - Sign up with email and password
   - Verify email code (check terminal for dev code)

5. **Start Using**
   - Add friends
   - Create chats
   - Send messages!

---

## Documentation

- **[README.md](README.md)** - Project overview
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[SETUP.md](SETUP.md)** - This file
- **[CHANGELOG.md](CHANGELOG.md)** - What's new in v1.0.0
- **[MONGODB_SETUP.md](MONGODB_SETUP.md)** - MongoDB configuration
- **[ROADMAP.md](ROADMAP.md)** - Future features

---

## Support & Help

### Common Issues
- Check [SETUP.md](SETUP.md) Troubleshooting section
- Check GitHub Issues

### Need Help?
- GitHub Issues: Report bugs and request features
- GitHub Discussions: Ask questions and share ideas
- Documentation: Check [README.md](README.md) and guides

---

## Next Steps

After successful installation:
1. Read [QUICKSTART.md](QUICKSTART.md) for first-time usage
2. Explore features in the application
3. Check [ROADMAP.md](ROADMAP.md) for upcoming features
4. Contribute to development!

---

**Happy messaging! 🚀**

Made with ❤️ for better conversations
