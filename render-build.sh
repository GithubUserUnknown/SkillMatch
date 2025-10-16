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
npm run build

echo "✅ Build completed successfully!"

