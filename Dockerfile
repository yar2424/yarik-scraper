FROM node:16.17-alpine as ts-compiler
WORKDIR /usr/app
COPY package.json .
COPY tsconfig.json .
RUN npm install
COPY . .
RUN npm run build


FROM ghcr.io/puppeteer/puppeteer:19.4.1

COPY package.json package.json
RUN npm i --omit=dev

COPY --from=ts-compiler /usr/app/out/ ./out/

CMD ["node", "out/main.js"]
# CMD ["pwd"]
# CMD ["node", "out/scrappers/testscrapperAllSpares.js"]
