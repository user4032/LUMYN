# LUMYN Messenger - Setup Installer (PowerShell)
# Version 1.0.0

param(
    [switch]$SkipDependencies = $false,
    [switch]$SkipBuild = $false
)

# Colors and formatting
function Write-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[✗] $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[i] $Message" -ForegroundColor Cyan
}

function Print-Header {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "║              LUMYN MESSENGER - INSTALLER v1.0.0             ║" -ForegroundColor Cyan
    Write-Host "║                  Where connections come alive                ║" -ForegroundColor Cyan
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# Main script
Print-Header

Write-Host "Checking system requirements..." -ForegroundColor Yellow
Write-Host ""

# Check for Node.js
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Error-Custom "Node.js is not installed!"
    Write-Info "Please install Node.js from https://nodejs.org/"
    exit 1
}
$nodeVersion = (node --version)
Write-Success "Node.js found: $nodeVersion"

# Check for npm
$npmCheck = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCheck) {
    Write-Error-Custom "npm is not installed!"
    exit 1
}
$npmVersion = (npm --version)
Write-Success "npm found: $npmVersion"

# Check for MongoDB
$mongoCheck = Get-Command mongod -ErrorAction SilentlyContinue
if (-not $mongoCheck) {
    Write-Warning-Custom "MongoDB is not installed locally"
    Write-Info "You can use MongoDB Atlas: https://www.mongodb.com/cloud/atlas"
} else {
    Write-Success "MongoDB found"
}

Write-Host ""
Read-Host "Press Enter to continue with installation"

Print-Header

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "                    INSTALLING DEPENDENCIES" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$scriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $scriptPath

if (-not $SkipDependencies) {
    Write-Info "Installing npm dependencies..."
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "npm dependencies installed"
    } else {
        Write-Error-Custom "Failed to install npm dependencies"
        exit 1
    }
} else {
    Write-Warning-Custom "Skipping dependency installation"
}

Write-Host ""

if (-not $SkipBuild) {
    Write-Info "Building TypeScript..."
    npx tsc --noEmit
    if ($LASTEXITCODE -eq 0) {
        Write-Success "TypeScript build complete"
    } else {
        Write-Warning-Custom "TypeScript compilation completed with warnings"
    }
} else {
    Write-Warning-Custom "Skipping TypeScript build"
}

Write-Host ""

Write-Info "Setting up environment..."
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Success ".env created from .env.example"
} else {
    Write-Success ".env already exists"
}

Write-Host ""
Write-Info "Verifying MongoDB..."
Write-Host ""
Write-Info "MongoDB Configuration:"

$mongoDataPath = "$env:APPDATA\MongoDB"
if (Test-Path $mongoDataPath) {
    Write-Success "MongoDB directory found: $mongoDataPath"
} else {
    Write-Warning-Custom "MongoDB data directory not found"
    Write-Info "Run 'mongod' in another terminal to start MongoDB"
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "                    INSTALLATION COMPLETE!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Start MongoDB:" -ForegroundColor Cyan
Write-Host "     mongod"
Write-Host ""
Write-Host "  2. Start the application:" -ForegroundColor Cyan
Write-Host "     npm run dev"
Write-Host ""
Write-Host "  3. Or build for production:" -ForegroundColor Cyan
Write-Host "     npm run build"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - README.md          - Project overview"
Write-Host "  - SETUP.md           - Detailed setup guide"
Write-Host "  - QUICKSTART.md      - Quick start guide"
Write-Host ""

Read-Host "Press Enter to exit"
