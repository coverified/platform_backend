# https://docs.docker.com/samples/library/node/
ARG NODE_VERSION=12.10.0

# Build container
FROM node:${NODE_VERSION}-alpine

WORKDIR /home/node

ADD . /home/node
RUN yarn --frozen-lockfile
RUN echo "yarn --frozen-lockfile && yarn dev" > /home/init.sh
RUN chmod +x /home/init.sh

EXPOSE 3000
CMD ["/home/init.sh"]
