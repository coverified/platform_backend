# https://docs.docker.com/samples/library/node/
ARG NODE_VERSION=14
# https://github.com/Yelp/dumb-init/releases
ARG DUMB_INIT_VERSION=1.2.2

# Build container
FROM node:${NODE_VERSION}-alpine
ARG DUMB_INIT_VERSION
ENV NODE_ENV=production

WORKDIR /home/node

ADD app /home/node

RUN wget -O dumb-init -q https://github.com/Yelp/dumb-init/releases/download/v${DUMB_INIT_VERSION}/dumb-init_${DUMB_INIT_VERSION}_amd64 \
    && chmod +x dumb-init \
    && npm i -g node-fetch \
    && yarn --frozen-lockfile \
    && yarn build

EXPOSE 80

CMD ["./dumb-init", "yarn", "start:safe"]
