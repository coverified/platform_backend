# https://docs.docker.com/samples/library/node/
ARG NODE_VERSION=14

# Build container
FROM node:${NODE_VERSION}-alpine

WORKDIR /home/node

RUN npm i -g node-fetch
RUN apk add zsh
RUN apk add nano
