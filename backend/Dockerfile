FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Create uploads folder (multer needs it)
RUN mkdir -p uploads

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "src/index.js"]