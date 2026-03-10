FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the Vite application
RUN npm run build

# Install a simple static server
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Serve the 'dist' directory
CMD ["serve", "-s", "dist", "-l", "3000"]
