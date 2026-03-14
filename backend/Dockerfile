# Start with a Node.js base image
FROM node:20-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json and package-lock.json are copied.
COPY package*.json ./

# Install absolute dependencies
RUN npm install

# Copy local code to the container image.
COPY . .

# Expose port 3001
EXPOSE 3001

# Run the web service on container startup.
CMD [ "npm", "run", "dev" ]
