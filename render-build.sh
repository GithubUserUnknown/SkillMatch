#!/usr/bin/env bash
# Render build script - Installs system dependencies and builds the app

set -e  # Exit on error

echo "📦 Installing system dependencies..."

# Update package list
apt-get update

# Install LaTeX (for PDF compilation)
echo "📄 Installing LaTeX..."
apt-get install -y texlive-latex-base texlive-latex-extra texlive-fonts-recommended

# Install Pandoc (for DOC conversion)
echo "📝 Installing Pandoc..."
apt-get install -y pandoc

# Install poppler-utils (for pdftotext - PDF parsing)
echo "🔍 Installing PDF tools..."
apt-get install -y poppler-utils

# Clean up to reduce image size
apt-get clean
rm -rf /var/lib/apt/lists/*

echo "✅ System dependencies installed successfully!"

# Install Node dependencies
echo "📦 Installing Node dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
echo "📝 Environment variables for build:"
echo "  - VITE_SUPABASE_KEY: ${VITE_SUPABASE_KEY:0:10}..." # Show first 10 chars only
echo "  - NODE_ENV: $NODE_ENV"

# Ensure VITE_ variables are available during build
# Vite needs these at build time to embed them in the bundle
if [ -z "$VITE_SUPABASE_KEY" ]; then
  echo "⚠️  WARNING: VITE_SUPABASE_KEY is not set!"
  echo "   The frontend will not be able to connect to Supabase."
  echo "   Please set this environment variable in Render dashboard."
fi

npm run build

echo "✅ Build completed successfully!"

