FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN PAYLOAD_SECRET=build-only-placeholder-secret-not-used-at-runtime CMS_DATA_DIR=/tmp/cms-build npm run build

FROM build AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 ca-certificates tini && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 CMS_DATA_DIR=/data HOSTNAME=0.0.0.0
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
ENTRYPOINT ["tini", "--"]
CMD ["sh", "-c", "npm run payload -- migrate && npm run start"]
