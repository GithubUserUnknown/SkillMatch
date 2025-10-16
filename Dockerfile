# Use Node.js 18 slim image
FROM node:18-slim

# Install LaTeX (for PDF compilation)
RUN apt-get install -y \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-bibtex-extra \
    texlive-fonts-extra \
    biber \
    # Install Pandoc (for DOC conversion)
    # Install poppler-utils (for pdftotext - PDF parsing)
    poppler-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Update package list
RUN apt-get update
# Update TeX Live
RUN tlmgr update --self
RUN tlmgr update --all

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

