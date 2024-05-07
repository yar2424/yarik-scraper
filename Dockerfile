FROM node:alpine as ts-compiler
WORKDIR /usr/app
COPY package.json .
COPY tsconfig.json .
RUN npm install --omit=prod
COPY . .
RUN npm run build


FROM ghcr.io/puppeteer/puppeteer:latest

COPY package.json package.json
RUN npm i --omit=dev

COPY --from=ts-compiler /usr/app/out/ ./out/

CMD ["timeout", "-k", "5m", "6h", "node", "out/main.js"]
