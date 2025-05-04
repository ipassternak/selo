FROM node:20-alpine as build
WORKDIR /tmp/
COPY package.json package-lock.json ./
RUN npm install
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY lib/ lib/
COPY config/ config/
COPY src/ src/
COPY prisma/schema.prisma prisma/schema.prisma
RUN npx prisma generate
RUN npm run build
RUN npm prune --production

FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY --from=build /tmp/node_modules/ ./node_modules/
COPY --from=build /tmp/dist/ ./dist/
COPY --from=build /tmp/package.json ./package.json
USER node
CMD ["node", "dist/src/main.js"]