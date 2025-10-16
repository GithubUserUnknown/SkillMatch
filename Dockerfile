# Use Node.js 18 slim image
FROM node:18-slim

# Install system dependencies required for the app
RUN apt-get update && apt-get install -y \
    # LaTeX for PDF compilation
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    # Pandoc for DOC conversion
    pandoc \
    # pdftotext for PDF parsing
    poppler-utils \
    # Clean up to reduce image size
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (Render will set PORT env variable)
EXPOSE 10000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]

