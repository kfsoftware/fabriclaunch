

FROM node:20-slim as build

ARG BUN_VERSION=1.1.18

WORKDIR /build

# Install Bun in the specified version
RUN apt update && apt install -y bash curl unzip && \
 curl https://bun.sh/install | bash -s -- bun-v${BUN_VERSION}

ENV PATH="${PATH}:/root/.bun/bin"

#
# Copy the lock file and app manifest, then install
# the dependencies, including the dev dependencies
#
COPY bun.lockb package.json ./
COPY ./apps/web/package.json ./apps/web/package.json
COPY ./packages/ ./packages/

RUN bun install

# Copy the application sources into the build stage
COPY ./packages ./packages
COPY ./turbo.json ./turbo.json
COPY ./apps/web ./apps/web


ARG AUTH_SECRET_KEY
ARG AUTH_SECRET
ARG NEXTAUTH_SECRET
ARG POSTGRES_URL
ARG NEXT_PUBLIC_EXTERNAL_URL
ARG AUTH_DRIZZLE_URL
ARG AUTH_URL

ARG PASSWORD_SALT

ARG GITHUB_ID
ARG GITHUB_SECRET


ARG RESEND_API_KEY

ARG EMAIL_FROM


RUN bunx turbo run --filter=web build


#
# After building the application, we will remove the node_modules
# directory and install only the production dependencies.
#
# Note that clearing the Bun package cache is necessary because I encountered
# extremely slow install times during building the image. This issue seems to be
# related to: https://github.com/oven-sh/bun/issues/4066
#
# RUN rm -rf node_modules && \
#   rm -rf /root/.bun/install/cache/ && \
#   bun install --frozen-lockfile --production

#
# Optional step: Here we will prune all unnecessary files from our
# node_modules directory, such as markdown and TypeScript source files,
# to further reduce the container image size.
#
RUN curl -sf https://gobinaries.com/tj/node-prune | sh && \
    node-prune

FROM node:20-slim as distribution

ENV NODE_ENV="production"

WORKDIR /app

# ADJUST: Copy application build artifacts.
COPY --from=build --chown=node:node /build/node_modules ./node_modules
COPY --from=build --chown=node:node /build/apps/web ./apps/web
COPY --from=build --chown=node:node /build/turbo.json ./turbo.json
COPY --from=build --chown=node:node /build/package.json ./package.json

# RUN chown -R node:node /app
COPY ./apps/web/start-with-migrate.sh ./apps/web/

WORKDIR /app/apps/web
# Make the start script executable
RUN chmod +x start-with-migrate.sh

# Use the start script as the CMD
CMD ["./start-with-migrate.sh"]