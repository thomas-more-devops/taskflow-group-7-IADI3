# ---- Builder stage ----
# No build step for this app; this stage exists purely to produce a clean,
# production-only node_modules without dragging devDependencies or npm's
# own cache into the final image.
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first so this layer is cached unless deps change
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Production stage ----
FROM node:22-alpine AS production

WORKDIR /app

# Bring over only what's needed to run: deps from the builder, then code
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=node:node . .

# The official node:alpine image already ships a non-root "node" user
USER node

EXPOSE 3000

CMD ["npm", "start"]
