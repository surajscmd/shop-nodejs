# Use the official Node.js image
FROM node:alpine3.18

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose the app port (change if needed)
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
