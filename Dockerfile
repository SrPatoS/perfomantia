FROM oven/bun:latest as builder

WORKDIR /app

# Step 1: Build the Frontend
COPY webapp/package.json webapp/bun.lockb* /app/webapp/
WORKDIR /app/webapp
RUN bun install
COPY webapp/ /app/webapp/
RUN bun run build

# Step 2: Set up the Backend
WORKDIR /app/core-server
COPY core-server/package.json core-server/bun.lockb* ./
RUN bun install
COPY core-server/ ./

# Using lightweight local execution
# We will run the server natively with bun inside the container.
# The server already expects static files in `../webapp/dist`

ENV NODE_ENV=production
ENV PORT=3000

# Mount a volume for SQLite DB to persist between restarts
RUN bun run src/db.ts # Seeks to seed the admin DB before run

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
