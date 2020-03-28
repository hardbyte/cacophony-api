FROM node:12

ENV TZ=Pacific/Auckland

RUN echo $TZ > /etc/timezone \
 && ln -sf /usr/share/zoneinfo/$TZ /etc/localtime

COPY docker-entrypoint.sh /

# API
EXPOSE 1080

# API - fileProcessing
EXPOSE 2008

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN echo "---- Generating API doc ----" && npm run apidoc
RUN echo "---- Compiling Typescript --" && ./node_modules/.bin/tsc

CMD "/docker-entrypoint.sh"
