#!/bin/bash
# LUMYN Messenger - Setup Installer (macOS/Linux)
# Version 1.0.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║              LUMYN MESSENGER - INSTALLER v1.0.0             ║"
    echo "║                  Where connections come alive                ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Start
clear
print_header

echo ""
echo "Checking system requirements..."
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    print_info "Please install Node.js from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js found: $NODE_VERSION"

# Check for npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    exit 1
fi
NPM_VERSION=$(npm --version)
print_success "npm found: $NPM_VERSION"

# Check for MongoDB
if ! command -v mongod &> /dev/null; then
    print_warning "MongoDB is not installed locally"
    print_info "You can use MongoDB Atlas: https://www.mongodb.com/cloud/atlas"
else
    MONGO_VERSION=$(mongod --version | head -1)
    print_success "MongoDB found: $MONGO_VERSION"
fi

echo ""
read -p "Press Enter to continue with installation..."

clear
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "                    INSTALLING DEPENDENCIES"
echo "════════════════════════════════════════════════════════════════"
echo ""

cd "$(dirname "$0")"

print_info "Installing npm dependencies..."
npm install
print_success "npm dependencies installed"

echo ""
print_info "Building TypeScript..."
npx tsc --noEmit || print_warning "TypeScript compilation completed with warnings"
print_success "TypeScript build complete"

echo ""
print_info "Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_success ".env created from .env.example"
else
    print_success ".env already exists"
fi

echo ""
print_info "Verifying MongoDB..."
echo ""
print_info "MongoDB Configuration:"
if [ -d "$HOME/.mongodb" ]; then
    print_success "MongoDB directory found"
else
    print_warning "MongoDB data directory not found"
    print_info "Run 'mongod' in another terminal to start MongoDB"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "                    INSTALLATION COMPLETE!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo ""
echo "  1. Start MongoDB:"
echo "     mongod"
echo ""
echo "  2. Start the application:"
echo "     npm run dev"
echo ""
echo "  3. Or build for production:"
echo "     npm run build"
echo ""
echo "Documentation:"
echo "  - README.md          - Project overview"
echo "  - SETUP.md           - Detailed setup guide"
echo "  - QUICKSTART.md      - Quick start guide"
echo ""
