FROM node:22-alpine

WORKDIR /app

# Copy package files first so npm install is cached unless deps change
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
