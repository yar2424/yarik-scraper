FROM ghcr.io/puppeteer/puppeteer:19.4.1

COPY package.json package.json
RUN npm i

COPY out out

CMD ["node", "out/main.js"]
# CMD ["pwd"]
# CMD ["node", "out/scrappers/testscrapperAllSpares.js"]
