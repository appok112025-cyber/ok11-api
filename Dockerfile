# Base stage with pnpm setup
FROM node:20-alpine AS base

WORKDIR /app

# Enable corepack and prepare pnpm (cached unless Node version changes)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Dependencies stage - production only
FROM base AS dependencies

# Copy only dependency files (cached unless these files change)
COPY package.json pnpm-lock.yaml ./

# Install production dependencies (cached unless package files change)
RUN pnpm install --frozen-lockfile --prod && pnpm store prune

# Build stage - all dependencies
FROM base AS build

# Copy only dependency files (cached unless these files change)
COPY package.json pnpm-lock.yaml ./

# Install all dependencies including devDependencies (cached unless package files change)
RUN pnpm install --frozen-lockfile

# Copy TypeScript config first (cached unless tsconfig changes)
COPY tsconfig.json ./

# Copy source code (only invalidates cache when source changes)
COPY src ./src

# Build TypeScript (only runs when source or config changes)
RUN pnpm run build

# Runtime stage - minimal production image
FROM base AS runtime

ENV NODE_ENV=production

# Copy production dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy package.json for runtime metadata
COPY --from=build /app/package.json ./package.json

# Copy secrets (consider using Docker secrets or env vars in production)
COPY secrets ./secrets

EXPOSE 5925

# Run as non-root user for security
USER node

CMD ["node", "dist/server.js"]

