#!/usr/bin/env pwsh
# LUMYN Migration Script - Automated structure reorganization
# Version: 1.0
# Usage: .\migrate-structure.ps1

param(
    [switch]$DryRun = $false,
    [switch]$Backup = $true
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Step {
    param([string]$Message)
    Write-Host "`n🔹 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✅ $Message" -ForegroundColor Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "  ⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "  ❌ $Message" -ForegroundColor Red
}

# Banner
Write-Host @"

╔══════════════════════════════════════════════════════════╗
║                                                          ║
║          🚀 LUMYN Structure Migration Tool 🚀            ║
║                                                          ║
║  Migrating to modular monorepo structure...             ║
║  client/ | server/ | electron/ | tests/                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

# Validation
Write-Step "Validating current structure..."

if (-not (Test-Path "src")) {
    Write-Error-Custom "src/ folder not found. Are you in the LUMYN root directory?"
    exit 1
}

if (-not (Test-Path "server")) {
    Write-Error-Custom "server/ folder not found. Are you in the LUMYN root directory?"
    exit 1
}

Write-Success "Current structure validated"

# Backup
if ($Backup -and -not $DryRun) {
    Write-Step "Creating backup..."
    
    $backupFolder = "backup_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
    New-Item -ItemType Directory -Force -Path $backupFolder | Out-Null
    
    Copy-Item -Path "src" -Destination "$backupFolder/src" -Recurse -Force
    Copy-Item -Path "server" -Destination "$backupFolder/server" -Recurse -Force
    Copy-Item -Path "package.json" -Destination "$backupFolder/package.json" -Force
    
    Write-Success "Backup created in $backupFolder"
}

# Phase 1: Create new directory structure
Write-Step "Phase 1/7: Creating new directory structure..."

$directories = @(
    "client/public",
    "client/src/components",
    "client/src/services",
    "client/src/store",
    "client/src/utils",
    "client/src/styles",
    "client/src/api",
    "client/src/i18n",
    "client/src/assets",
    "server/controllers",
    "server/services",
    "server/middlewares",
    "server/routes",
    "server/utils",
    "server/config",
    "electron",
    "tests/client",
    "tests/server"
)

foreach ($dir in $directories) {
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would create: $dir"
    } else {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
}

Write-Success "Directory structure created ($(($directories).Count) directories)"

# Phase 2: Move client files
Write-Step "Phase 2/7: Migrating client files..."

$clientMoves = @{
    "src/renderer/components" = "client/src/components"
    "src/renderer/services" = "client/src/services"
    "src/renderer/store" = "client/src/store"
    "src/renderer/utils" = "client/src/utils"
    "src/renderer/styles" = "client/src/styles"
    "src/renderer/api" = "client/src/api"
    "src/renderer/i18n" = "client/src/i18n"
    "src/renderer/assets" = "client/src/assets"
}

$clientFiles = @{
    "src/renderer/App.tsx" = "client/src/App.tsx"
    "src/renderer/main.tsx" = "client/src/main.tsx"
    "src/renderer/theme.ts" = "client/src/theme.ts"
    "index.html" = "client/public/index.html"
    "tsconfig.json" = "client/tsconfig.json"
    "vite.config.ts" = "client/vite.config.ts"
}

foreach ($move in $clientMoves.GetEnumerator()) {
    if (Test-Path $move.Key) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would copy: $($move.Key) → $($move.Value)"
        } else {
            Copy-Item -Path $move.Key -Destination $move.Value -Recurse -Force
            Write-Success "Copied: $($move.Key)"
        }
    } else {
        Write-Warning-Custom "Not found: $($move.Key)"
    }
}

foreach ($file in $clientFiles.GetEnumerator()) {
    if (Test-Path $file.Key) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would copy: $($file.Key) → $($file.Value)"
        } else {
            Copy-Item -Path $file.Key -Destination $file.Value -Force
            Write-Success "Copied: $($file.Key)"
        }
    } else {
        Write-Warning-Custom "Not found: $($file.Key)"
    }
}

Write-Success "Client migration complete"

# Phase 3: Create client package.json
Write-Step "Phase 3/7: Creating client/package.json..."

$clientPackageJson = @"
{
  "name": "lumyn-client",
  "version": "1.0.12",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.15.0",
    "@mui/material": "^5.15.0",
    "@reduxjs/toolkit": "^2.2.0",
    "axios": "^1.6.0",
    "date-fns": "^3.3.0",
    "emoji-picker-react": "^4.8.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^9.1.0",
    "react-router-dom": "^6.22.0",
    "socket.io-client": "^4.6.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0"
  }
}
"@

if (-not $DryRun) {
    $clientPackageJson | Out-File -FilePath "client/package.json" -Encoding UTF8
}

Write-Success "Client package.json created"

# Phase 4: Move Electron files
Write-Step "Phase 4/7: Migrating Electron files..."

$electronFiles = @{
    "src/main/main.js" = "electron/main.ts"
    "src/main/preload.js" = "electron/preload.ts"
}

foreach ($file in $electronFiles.GetEnumerator()) {
    if (Test-Path $file.Key) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would copy: $($file.Key) → $($file.Value)"
        } else {
            Copy-Item -Path $file.Key -Destination $file.Value -Force
            Write-Success "Copied: $($file.Key)"
        }
    } else {
        Write-Warning-Custom "Not found: $($file.Key)"
    }
}

Write-Success "Electron migration complete"

# Phase 5: Create Electron package.json
Write-Step "Phase 5/7: Creating electron/package.json..."

$electronPackageJson = @"
{
  "name": "lumyn-electron",
  "version": "1.0.12",
  "main": "main.ts",
  "scripts": {
    "dev": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "dependencies": {
    "electron-log": "^5.4.3",
    "electron-updater": "^6.3.0"
  },
  "devDependencies": {
    "electron": "^28.2.0",
    "electron-builder": "^26.7.0"
  }
}
"@

if (-not $DryRun) {
    $electronPackageJson | Out-File -FilePath "electron/package.json" -Encoding UTF8
}

Write-Success "Electron package.json created"

# Phase 6: Organize server files
Write-Step "Phase 6/7: Organizing server structure..."

if (Test-Path "server/models") {
    Write-Success "Server models already in place"
} else {
    Write-Warning-Custom "Server models not found - you'll need to create them manually"
}

# Create server package.json
$serverPackageJson = @"
{
  "name": "lumyn-server",
  "version": "1.0.12",
  "main": "app.ts",
  "scripts": {
    "dev": "nodemon app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "joi": "^17.12.0",
    "mongoose": "^9.2.1",
    "nodemailer": "^6.9.13",
    "socket.io": "^4.8.3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.0"
  }
}
"@

if (-not $DryRun) {
    $serverPackageJson | Out-File -FilePath "server/package.json" -Encoding UTF8
}

Write-Success "Server package.json created"

# Phase 7: Update root package.json
Write-Step "Phase 7/7: Updating root package.json..."

$rootPackageJson = @"
{
  "name": "lumyn",
  "version": "1.0.12",
  "description": "Where connections come alive",
  "author": "Your Name",
  "license": "MIT",
  "private": true,
  "workspaces": [
    "client",
    "server",
    "electron"
  ],
  "scripts": {
    "dev": "concurrently \\"npm run dev:client\\" \\"npm run dev:server\\" \\"npm run dev:electron\\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && npm run dev",
    "dev:electron": "wait-on http://localhost:5173 && cd electron && npm run dev",
    
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npm run build",
    "build:desktop": "npm run build && cd electron && npm run build",
    
    "test": "jest --config tests/jest.config.js",
    "test:client": "jest --config tests/jest.config.js --selectProjects client",
    "test:server": "jest --config tests/jest.config.js --selectProjects server",
    "test:coverage": "jest --config tests/jest.config.js --coverage",
    
    "lint": "npm run lint:client && npm run lint:server",
    "lint:client": "cd client && npm run lint",
    "lint:server": "cd server && npm run lint",
    
    "install:all": "npm install && cd client && npm install && cd ../server && npm install && cd ../electron && npm install"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.11.0",
    "concurrently": "^8.2.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "wait-on": "^7.2.0"
  }
}
"@

if (-not $DryRun) {
    # Backup original
    if (Test-Path "package.json") {
        Copy-Item -Path "package.json" -Destination "package.json.old" -Force
    }
    
    $rootPackageJson | Out-File -FilePath "package.json" -Encoding UTF8
}

Write-Success "Root package.json updated"

# Summary
Write-Host @"

╔══════════════════════════════════════════════════════════╗
║                                                          ║
║              ✅ Migration Complete! ✅                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Green

if ($DryRun) {
    Write-Host "🔸 DRY RUN MODE - No files were actually moved" -ForegroundColor Yellow
    Write-Host "🔸 Run without -DryRun flag to perform actual migration" -ForegroundColor Yellow
} else {
    Write-Host @"
📋 Next Steps:

1. Install dependencies:
   npm run install:all

2. Review migrated files:
   - client/src/ (React components)
   - server/ (Backend structure - needs refactoring)
   - electron/ (Desktop wrapper)

3. Update import paths in client files:
   - Change relative imports to use @ alias
   - Example: import Button from '@/components/Button'

4. Create server controllers/services/routes:
   - Follow REFACTORING_PLAN.md guide
   - Start with auth module

5. Configure tests:
   - Review tests/jest.config.js
   - Write tests in tests/client/ and tests/server/

6. Test everything:
   npm run dev
   npm test

7. Commit changes:
   git add .
   git commit -m "refactor: Migrate to modular monorepo structure"

📚 Documentation:
   - MIGRATION_TO_NEW_STRUCTURE.md (this guide)
   - REFACTORING_PLAN.md (detailed refactoring steps)
   - QUICKSTART_REFACTORING.md (quick start guide)

🎯 Your LUMYN project is now ready for 8/10 portfolio level!

"@ -ForegroundColor Cyan
}

Write-Host "`n🚀 Happy coding! Let's make LUMYN amazing! 🚀`n" -ForegroundColor Magenta
